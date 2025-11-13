'use client'

import { useEffect, useState } from 'react'
import MainLayout from '../components/MainLayout'
import styles from './page.module.css'
import { db } from '@/lib/firebase/config'
import { useAuth } from '../components/AuthProvider'
import { collection, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
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

interface CartItem {
  servicioId: string
  descripcion?: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface FacturacionData {
  items: CartItem[]
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
  const [selectedServicioId, setSelectedServicioId] = useState<string>('')

  const [facturacionData, setFacturacionData] = useState<FacturacionData>({
    items: [],
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
  const [cart, setCart] = useState<CartItem[]>([])
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
  const auth = useAuth()

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
    if (cart.length === 0 || !facturacionData.cliente.nombre) {
      showError('Por favor, completa todos los campos obligatorios.')
      return
    }
    // set the method on state for UI, but pass it explicitly to finalizarFacturacion
  setFacturacionData({ ...facturacionData, metodoPago: metodo })
    setShowPagoModal(true)

    if (metodo === 'tarjeta') {
      setProcesandoPago(true)
      // Simular procesamiento de tarjeta con timeout de 3 segundos
      setTimeout(() => {
        setProcesandoPago(false)
        finalizarFacturacion(metodo)
      }, 3000)
    } else {
      // Efectivo: procesar inmediatamente
      finalizarFacturacion(metodo)
    }
  }

  const finalizarFacturacion = async (metodoOverride?: 'efectivo' | 'tarjeta') => {
    try {
      // Obtener datos del servicio
      // Build items from cart (ensure latest prices from servicios list)
      const serviciosMap = Object.fromEntries(servicios.map(s => [s.id, s]))
      const items = cart.map(ci => ({
        descripcion: ci.descripcion ?? (serviciosMap[ci.servicioId]?.Descripcion || serviciosMap[ci.servicioId]?.TipoServicio || ''),
        cantidad: ci.cantidad,
        precioUnitario: ci.precioUnitario,
        subtotal: ci.subtotal,
      }))

      // Calcular montos
      const montoBruto = items.reduce((sum, it) => sum + (it.subtotal ?? (it.precioUnitario * it.cantidad)), 0)
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
        items,
        resumenFiscal: {
          montoBruto,
          tasaItbis,
          montoItbis: facturacionData.requiereComprobanteFiscal ? montoItbis : 0,
          montoTotal: facturacionData.requiereComprobanteFiscal ? montoTotal : montoBruto,
        },
        requiereComprobanteFiscal: facturacionData.requiereComprobanteFiscal,
        metodoPago: metodoOverride ?? facturacionData.metodoPago,
      }

      // Guardar en localStorage para pasarlo al recibo
      localStorage.setItem('reciboFiscalData', JSON.stringify(reciboData))

      // También guardar la factura en Firestore para historial y cierres
      try {
        if (!db) {
          showError('Firebase no está inicializado.')
          return
        }
        const docRef = await addDoc(collection(db, 'Facturas'), {
          ...reciboData,
          resumenFiscal: reciboData.resumenFiscal,
          metodoPago: reciboData.metodoPago,
          requiereComprobanteFiscal: reciboData.requiereComprobanteFiscal,
          items: reciboData.items,
          totalVentas: reciboData.resumenFiscal.montoTotal,
          createdAt: serverTimestamp(),
          createdBy: auth.user ? { id: auth.user.id, username: auth.user.username } : null,
        })

        showSuccess('Factura generada correctamente')
        setShowPagoModal(false)

        // Limpiar carrito
        setCart([])

        // Redirigir a la vista del recibo con id para cargar factura exacta
        setTimeout(() => {
          router.push(`/recibo-fiscal?id=${docRef.id}`)
        }, 500)
      } catch (err) {
        console.error('Error guardando factura en Firestore:', err)
        showError('Error guardando la factura.')
      }
    } catch (error: any) {
      console.error('Error al finalizar facturación:', error)
      showError('Error al generar la factura.')
      setProcesandoPago(false)
    }
  }

  const servicioSeleccionado = servicios.find((s) => s.id === selectedServicioId)

  const addServiceToCart = () => {
    if (!selectedServicioId) return
    const s = servicios.find(ss => ss.id === selectedServicioId)
    if (!s) return
    const existing = cart.find(c => c.servicioId === s.id)
    if (existing) {
      setCart(cart.map(c => c.servicioId === s.id ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad+1)*c.precioUnitario } : c))
    } else {
      const item: CartItem = { servicioId: s.id, descripcion: s.Descripcion || s.TipoServicio, cantidad: 1, precioUnitario: s.Costo, subtotal: s.Costo }
      setCart([...cart, item])
    }
  }

  const removeFromCart = (servicioId: string) => {
    setCart(cart.filter(c => c.servicioId !== servicioId))
  }

  const updateQuantity = (servicioId: string, cantidad: number) => {
    if (cantidad <= 0) return
    setCart(cart.map(c => c.servicioId === servicioId ? { ...c, cantidad, subtotal: cantidad * c.precioUnitario } : c))
  }

  const montoBrutoCart = cart.reduce((s, it) => s + (it.subtotal ?? 0), 0)

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
                value={selectedServicioId}
                onChange={(e) => setSelectedServicioId(e.target.value)}
                className={styles.select}
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
              <button onClick={addServiceToCart} style={{marginLeft:8}}>Agregar</button>
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

          {cart.length > 0 && (
            <div style={{marginTop:12}}>
              <h3>Carrito</h3>
              <table style={{width:'100%'}}>
                <thead><tr><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  {cart.map(it => (
                    <tr key={it.servicioId}>
                      <td>{it.descripcion}</td>
                      <td><input type="number" value={it.cantidad} min={1} style={{width:60}} onChange={(e)=>updateQuantity(it.servicioId, Number(e.target.value))} /></td>
                      <td>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(it.precioUnitario)}</td>
                      <td>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(it.subtotal)}</td>
                      <td><button onClick={()=>removeFromCart(it.servicioId)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{textAlign:'right', marginTop:8}}>
                <strong>Subtotal: {new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(montoBrutoCart)}</strong>
              </div>
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

        {cart.length > 0 && facturacionData.cliente.nombre && (
          <div className={styles.resumenSection}>
            <h2 className={styles.sectionTitle}>Resumen de Facturación</h2>
            <div className={styles.resumen}>
              <div className={styles.resumenItem}>
                <span>Cliente:</span>
                <span>{facturacionData.cliente.nombre}</span>
              </div>

              <div className={styles.detalleResumenItems}>
                <table style={{width:'100%'}}>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th className={styles.textRight}>Cantidad</th>
                      <th className={styles.textRight}>Precio</th>
                      <th className={styles.textRight}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((it) => (
                      <tr key={it.servicioId}>
                        <td>{it.descripcion}</td>
                        <td className={styles.textRight}>{it.cantidad}</td>
                        <td className={styles.textRight}>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(it.precioUnitario)}</td>
                        <td className={styles.textRight}>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{marginTop:8, textAlign:'right'}}>
                <div className={styles.resumenItem}>
                  <span>Subtotal (Monto Bruto):</span>
                  <span>
                    {new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(montoBrutoCart)}
                  </span>
                </div>

                {facturacionData.requiereComprobanteFiscal && (
                  <div className={styles.resumenItem}>
                    <span>ITBIS (18%):</span>
                    <span>
                      {new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(montoBrutoCart * 0.18)}
                    </span>
                  </div>
                )}

                <div className={styles.resumenItemTotal}>
                  <span>Total:</span>
                  <span>
                    {new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(facturacionData.requiereComprobanteFiscal ? montoBrutoCart * 1.18 : montoBrutoCart)}
                  </span>
                </div>
              </div>
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

