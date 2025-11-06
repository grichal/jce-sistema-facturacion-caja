'use client'

import { useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import styles from './page.module.css'
import { db } from '@/lib/firebase/config'
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore'
import { useToast } from '../hooks/useToast'
import { useRouter } from 'next/navigation'

interface Servicio {
  id: string
  Costo: number
  Descripcion: string
  Estatus: string
  TipoServicio: string
  TipoServicioRef?: string
}

interface Cliente {
  id?: string
  nombre: string
  rnc: string
  direccion: string
  telefono: string
  email?: string
}

interface FacturacionData {
  servicioId: string
  cliente: Cliente
  requiereComprobanteFiscal: boolean
  metodoPago: 'efectivo' | 'tarjeta' | null
}

export default function FacturacionPage() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showClienteForm, setShowClienteForm] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [facturacionData, setFacturacionData] = useState<FacturacionData>({
    servicioId: '',
    cliente: {
      nombre: '',
      rnc: '',
      direccion: '',
      telefono: '',
      email: '',
    },
    requiereComprobanteFiscal: false,
    metodoPago: null,
  })
  const [nuevoCliente, setNuevoCliente] = useState<Cliente>({
    nombre: '',
    rnc: '',
    direccion: '',
    telefono: '',
    email: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { showSuccess, showError } = useToast()
  const router = useRouter()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    await Promise.all([cargarServicios(), cargarClientes()])
  }

  const cargarServicios = async () => {
    if (!db) return

    try {
      const serviciosRef = collection(db, 'Servicios')
      const querySnapshot = await getDocs(serviciosRef)
      const serviciosData: Servicio[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.Estatus === 'Activo') {
          serviciosData.push({
            id: doc.id,
            ...data,
          } as Servicio)
        }
      })

      setServicios(serviciosData)
    } catch (error) {
      console.error('Error al cargar servicios:', error)
      showError('Error al cargar los servicios.')
    } finally {
      setLoading(false)
    }
  }

  const cargarClientes = async () => {
    if (!db) return

    try {
      const clientesRef = collection(db, 'Clientes')
      const querySnapshot = await getDocs(clientesRef)
      const clientesData: Cliente[] = []

      querySnapshot.forEach((doc) => {
        clientesData.push({
          id: doc.id,
          ...doc.data(),
        } as Cliente)
      })

      setClientes(clientesData)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    }
  }

  const validarCliente = (): boolean => {
    const errors: Record<string, string> = {}

    if (!nuevoCliente.nombre || nuevoCliente.nombre.trim() === '') {
      errors.nombre = 'El nombre es obligatorio'
    }

    if (!nuevoCliente.rnc || nuevoCliente.rnc.trim() === '') {
      errors.rnc = 'El RNC/Cédula es obligatorio'
    }

    if (!nuevoCliente.direccion || nuevoCliente.direccion.trim() === '') {
      errors.direccion = 'La dirección es obligatoria'
    }

    if (!nuevoCliente.telefono || nuevoCliente.telefono.trim() === '') {
      errors.telefono = 'El teléfono es obligatorio'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const guardarCliente = async () => {
    if (!validarCliente()) {
      showError('Por favor, completa todos los campos obligatorios.')
      return
    }

    if (!db) {
      showError('Firebase no está inicializado.')
      return
    }

    try {
      await addDoc(collection(db, 'Clientes'), nuevoCliente)
      showSuccess('Cliente agregado correctamente')
      setNuevoCliente({
        nombre: '',
        rnc: '',
        direccion: '',
        telefono: '',
        email: '',
      })
      setFormErrors({})
      setShowClienteForm(false)
      cargarClientes()
    } catch (error: any) {
      console.error('Error al guardar cliente:', error)
      showError('Error al guardar el cliente.')
    }
  }

  const seleccionarCliente = (cliente: Cliente) => {
    setFacturacionData({
      ...facturacionData,
      cliente,
    })
  }

  const generarNCF = (): string => {
    // Generar NCF ficticio (en producción vendría del backend)
    const prefijo = 'E31'
    const numero = Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, '0')
    return `${prefijo}${numero}`
  }

  const generarNumeroFactura = (): string => {
    const fecha = new Date()
    const año = fecha.getFullYear()
    const numero = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    return `FAC-${año}-${numero}`
  }

  const procesarPago = async (metodo: 'efectivo' | 'tarjeta') => {
    if (!facturacionData.servicioId || !facturacionData.cliente.nombre) {
      showError('Por favor, completa todos los campos obligatorios.')
      return
    }

    setFacturacionData({ ...facturacionData, metodoPago: metodo })
    setShowPagoModal(true)

    if (metodo === 'tarjeta') {
      setProcesandoPago(true)
      // Simular procesamiento de tarjeta con timeout de 3 segundos
      setTimeout(() => {
        setProcesandoPago(false)
        finalizarFacturacion()
      }, 3000)
    } else {
      // Efectivo: procesar inmediatamente
      finalizarFacturacion()
    }
  }

  const finalizarFacturacion = async () => {
    try {
      // Obtener datos del servicio
      if (!db || !facturacionData.servicioId) return

      const servicioRef = doc(db, 'Servicios', facturacionData.servicioId)
      const servicioSnap = await getDoc(servicioRef)

      if (!servicioSnap.exists()) {
        showError('El servicio seleccionado no existe.')
        return
      }

      const servicio = servicioSnap.data() as Servicio

      // Calcular montos
      const montoBruto = servicio.Costo
      const tasaItbis = 18
      const montoItbis = montoBruto * (tasaItbis / 100)
      const montoTotal = montoBruto + montoItbis

      // Generar datos del recibo
      const reciboData = {
        empresa: {
          nombre: 'Junta Central Electoral',
          rnc: '1-23-45678-9',
          direccion: 'Av. 27 de Febrero #455, Santo Domingo',
          telefono: '(809) 533-3333',
        },
        comprobante: {
          ncf: facturacionData.requiereComprobanteFiscal ? generarNCF() : '',
          fechaEmision: new Date().toLocaleDateString('es-DO'),
          numeroFactura: generarNumeroFactura(),
          codigoVerificacion: Math.random().toString(36).substring(2, 15).toUpperCase(),
        },
        cliente: {
          nombre: facturacionData.cliente.nombre,
          rnc: facturacionData.cliente.rnc,
          direccion: facturacionData.cliente.direccion,
          telefono: facturacionData.cliente.telefono,
        },
        items: [
          {
            descripcion: servicio.Descripcion || servicio.TipoServicio,
            cantidad: 1,
            precioUnitario: servicio.Costo,
            subtotal: servicio.Costo,
          },
        ],
        resumenFiscal: {
          montoBruto,
          tasaItbis,
          montoItbis: facturacionData.requiereComprobanteFiscal ? montoItbis : 0,
          montoTotal: facturacionData.requiereComprobanteFiscal ? montoTotal : montoBruto,
        },
        requiereComprobanteFiscal: facturacionData.requiereComprobanteFiscal,
        metodoPago: facturacionData.metodoPago,
      }

      // Guardar en localStorage para pasarlo al recibo
      localStorage.setItem('reciboFiscalData', JSON.stringify(reciboData))

      showSuccess('Factura generada correctamente')
      setShowPagoModal(false)

      // Redirigir a la vista del recibo
      setTimeout(() => {
        router.push('/recibo-fiscal')
      }, 1000)
    } catch (error: any) {
      console.error('Error al finalizar facturación:', error)
      showError('Error al generar la factura.')
      setProcesandoPago(false)
    }
  }

  const servicioSeleccionado = servicios.find((s) => s.id === facturacionData.servicioId)

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Facturación</h1>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>1. Seleccionar Servicio</h2>
          <div className={styles.formGroup}>
            <label htmlFor="servicio">Servicio *</label>
            <select
              id="servicio"
              value={facturacionData.servicioId}
              onChange={(e) =>
                setFacturacionData({ ...facturacionData, servicioId: e.target.value })
              }
              className={styles.select}
              required
            >
              <option value="">Seleccione un servicio</option>
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.Descripcion || servicio.TipoServicio} - {new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: 'DOP',
                  }).format(servicio.Costo)}
                </option>
              ))}
            </select>
          </div>

          {servicioSeleccionado && (
            <div className={styles.servicioInfo}>
              <h3>{servicioSeleccionado.Descripcion || servicioSeleccionado.TipoServicio}</h3>
              {servicioSeleccionado.TipoServicio && (
                <p><strong>Tipo:</strong> {servicioSeleccionado.TipoServicio}</p>
              )}
              <p className={styles.precio}>
                Precio: {new Intl.NumberFormat('es-DO', {
                  style: 'currency',
                  currency: 'DOP',
                }).format(servicioSeleccionado.Costo)}
              </p>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>2. Seleccionar o Agregar Cliente</h2>

          <button
            onClick={() => setShowClienteForm(!showClienteForm)}
            className={styles.btnSecondary}
          >
            {showClienteForm ? 'Cancelar' : '+ Agregar Nuevo Cliente'}
          </button>

          {showClienteForm && (
            <div className={styles.clienteForm}>
              <h3>Nuevo Cliente</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="nombre">Nombre/Razón Social *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={nuevoCliente.nombre}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                    }
                    className={`${styles.input} ${formErrors.nombre ? styles.inputError : ''}`}
                    required
                  />
                  {formErrors.nombre && (
                    <span className={styles.errorMessage}>{formErrors.nombre}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="rnc">RNC/Cédula *</label>
                  <input
                    type="text"
                    id="rnc"
                    value={nuevoCliente.rnc}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, rnc: e.target.value })
                    }
                    className={`${styles.input} ${formErrors.rnc ? styles.inputError : ''}`}
                    required
                  />
                  {formErrors.rnc && (
                    <span className={styles.errorMessage}>{formErrors.rnc}</span>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="direccion">Dirección *</label>
                  <input
                    type="text"
                    id="direccion"
                    value={nuevoCliente.direccion}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })
                    }
                    className={`${styles.input} ${formErrors.direccion ? styles.inputError : ''}`}
                    required
                  />
                  {formErrors.direccion && (
                    <span className={styles.errorMessage}>{formErrors.direccion}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="text"
                    id="telefono"
                    value={nuevoCliente.telefono}
                    onChange={(e) =>
                      setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                    }
                    className={`${styles.input} ${formErrors.telefono ? styles.inputError : ''}`}
                    required
                  />
                  {formErrors.telefono && (
                    <span className={styles.errorMessage}>{formErrors.telefono}</span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email (Opcional)</label>
                <input
                  type="email"
                  id="email"
                  value={nuevoCliente.email || ''}
                  onChange={(e) =>
                    setNuevoCliente({ ...nuevoCliente, email: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <button onClick={guardarCliente} className={styles.btnSubmit}>
                Guardar Cliente
              </button>
            </div>
          )}

          {clientes.length > 0 && (
            <div className={styles.clientesList}>
              <h3>Clientes Existentes</h3>
              <div className={styles.clientesGrid}>
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className={`${styles.clienteCard} ${
                      facturacionData.cliente.id === cliente.id ? styles.selected : ''
                    }`}
                    onClick={() => seleccionarCliente(cliente)}
                  >
                    <h4>{cliente.nombre}</h4>
                    <p>RNC/Cédula: {cliente.rnc}</p>
                    <p>Tel: {cliente.telefono}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {facturacionData.cliente.nombre && (
            <div className={styles.clienteSeleccionado}>
              <h3>Cliente Seleccionado:</h3>
              <p>
                <strong>{facturacionData.cliente.nombre}</strong> - RNC/Cédula:{' '}
                {facturacionData.cliente.rnc}
              </p>
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>3. Opciones de Facturación</h2>
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={facturacionData.requiereComprobanteFiscal}
                onChange={(e) =>
                  setFacturacionData({
                    ...facturacionData,
                    requiereComprobanteFiscal: e.target.checked,
                  })
                }
                className={styles.checkbox}
              />
              Requiere Comprobante Fiscal (NCF)
            </label>
            <p className={styles.helpText}>
              Marque esta opción si el cliente requiere un comprobante fiscal con NCF
            </p>
          </div>
        </div>

        {servicioSeleccionado && facturacionData.cliente.nombre && (
          <div className={styles.resumenSection}>
            <h2 className={styles.sectionTitle}>Resumen de Facturación</h2>
            <div className={styles.resumen}>
              <div className={styles.resumenItem}>
                <span>Servicio:</span>
                <span>{servicioSeleccionado.Descripcion || servicioSeleccionado.TipoServicio}</span>
              </div>
              <div className={styles.resumenItem}>
                <span>Cliente:</span>
                <span>{facturacionData.cliente.nombre}</span>
              </div>
              <div className={styles.resumenItem}>
                <span>Monto Bruto:</span>
                <span>
                  {new Intl.NumberFormat('es-DO', {
                    style: 'currency',
                    currency: 'DOP',
                  }).format(servicioSeleccionado.Costo)}
                </span>
              </div>
              {facturacionData.requiereComprobanteFiscal && (
                <>
                  <div className={styles.resumenItem}>
                    <span>ITBIS (18%):</span>
                    <span>
                      {new Intl.NumberFormat('es-DO', {
                        style: 'currency',
                        currency: 'DOP',
                      }).format(servicioSeleccionado.Costo * 0.18)}
                    </span>
                  </div>
                  <div className={styles.resumenItemTotal}>
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat('es-DO', {
                        style: 'currency',
                        currency: 'DOP',
                      }).format(servicioSeleccionado.Costo * 1.18)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className={styles.pagoButtons}>
              <button
                onClick={() => procesarPago('efectivo')}
                className={styles.btnEfectivo}
                disabled={procesandoPago}
              >
                💵 Pagar en Efectivo
              </button>
              <button
                onClick={() => procesarPago('tarjeta')}
                className={styles.btnTarjeta}
                disabled={procesandoPago}
              >
                💳 Pagar con Tarjeta
              </button>
            </div>
          </div>
        )}

        {showPagoModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              {procesandoPago ? (
                <div className={styles.procesandoPago}>
                  <div className={styles.spinner}></div>
                  <h3>Procesando pago con tarjeta...</h3>
                  <p>Por favor, espere mientras se procesa la transacción.</p>
                </div>
              ) : (
                <div className={styles.confirmacionPago}>
                  <h3>✅ Pago Confirmado</h3>
                  <p>
                    El pago se ha procesado correctamente. Generando el comprobante...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

