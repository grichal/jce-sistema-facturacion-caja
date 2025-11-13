 'use client'

import { useEffect, useState } from 'react'
import styles from './ReciboFiscal.module.css'
import { getLatestFactura, getFacturaById } from '../../lib/firebase/facturas'
import { useAuth } from './AuthProvider'
import { useSearchParams } from 'next/navigation'

interface ReciboData {
  empresa: {
    nombre: string
    rnc: string
    direccion: string
    telefono: string
  }
  comprobante: {
    ncf: string
    fechaEmision: string
    numeroFactura: string
    codigoVerificacion: string
  }
  cliente: {
    nombre: string
    rnc: string
    direccion: string
    telefono: string
  }
  items: Array<{
    descripcion: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
  resumenFiscal: {
    montoBruto: number
    tasaItbis: number
    montoItbis: number
    montoTotal: number
  }
  requiereComprobanteFiscal?: boolean
  metodoPago?: 'efectivo' | 'tarjeta' | null
}

export default function ReciboFiscal() {
  const [data, setData] = useState<ReciboData | null>(null)
  const [loading, setLoading] = useState(true)
  const auth = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const load = async () => {
      // Intentar parámetro ?id= para cargar factura específica
      const id = searchParams?.get('id')
      if (id) {
        try {
          const f = await getFacturaById(id)
          if (f) {
            setData(f as ReciboData)
            setLoading(false)
            return
          }
        } catch (err) {
          console.error('Error cargando factura por id:', err)
        }
      }

      // Luego intentar cargar datos desde localStorage (si vienen de facturación)
      const reciboDataFromStorage = localStorage.getItem('reciboFiscalData')
      if (reciboDataFromStorage) {
        try {
          const parsedData = JSON.parse(reciboDataFromStorage)
          setData(parsedData)
          setLoading(false)
          // Limpiar localStorage después de cargar
          localStorage.removeItem('reciboFiscalData')
          return
        } catch (error) {
          console.error('Error al parsear datos del localStorage:', error)
        }
      }

      // Si no hay datos en localStorage, intentar cargar la factura más reciente desde Firestore
      try {
        const latest = await getLatestFactura()
        if (latest) {
          setData(latest as ReciboData)
          return
        }

        // Fallback: cargar desde el JSON de ejemplo
        const response = await fetch('/data.json')
        const jsonData = await response.json()
        setData(jsonData as ReciboData)
      } catch (error) {
        console.error('Error al cargar los datos:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [searchParams])

  // Función para formatear números como moneda dominicana
  const formatearMoneda = (monto: number): string => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(monto)
  }

  // Función para imprimir el recibo
  const imprimirRecibo = () => {
    window.print()
  }

  // Función para generar PDF
  const generarPDF = () => {
    window.print()
  }

  if (loading) {
    return <div className={styles.container}>Cargando datos del recibo...</div>
  }

  if (!data) {
    return <div className={styles.container}>Error al cargar los datos del recibo.</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={imprimirRecibo} className={`${styles.btn} ${styles.btnPrimary}`}>
          Imprimir Recibo
        </button>
        <button onClick={generarPDF} className={`${styles.btn} ${styles.btnSecondary}`}>
          Generar PDF
        </button>
      </div>

      <div id="reciboFiscal" className={styles.reciboFiscal}>
        {/* Encabezado */}
        <div className={styles.encabezado}>
          <div className={styles.logo}>
            <h1>{data.empresa.nombre}</h1>
            <p className={styles.subtitulo}>Sistema de Facturación Fiscal</p>
          </div>
          <div className={styles.infoEmpresa}>
            <p>
              <strong>RNC:</strong> {data.empresa.rnc}
            </p>
            <p>
              <strong>Dirección:</strong> {data.empresa.direccion}
            </p>
            <p>
              <strong>Teléfono:</strong> {data.empresa.telefono}
            </p>
          </div>
        </div>

        {/* Información del Comprobante */}
        <div className={`${styles.seccion} ${styles.comprobante}`}>
          <h2>{data.requiereComprobanteFiscal ? 'COMPROBANTE FISCAL' : 'COMPROBANTE'}</h2>
          <div className={styles.infoComprobante}>
            {data.requiereComprobanteFiscal && (
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Número de Comprobante Fiscal (NCF):</span>
                <span className={styles.valor}>{data.comprobante.ncf || 'N/A'}</span>
              </div>
            )}
            <div className={styles.campo}>
              <span className={styles.etiqueta}>Fecha de Emisión:</span>
              <span className={styles.valor}>{data.comprobante.fechaEmision}</span>
            </div>
            <div className={styles.campo}>
              <span className={styles.etiqueta}>Número de Factura:</span>
              <span className={styles.valor}>{data.comprobante.numeroFactura}</span>
            </div>
            {data.metodoPago && (
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Método de Pago:</span>
                <span className={styles.valor}>
                  {data.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'}
                </span>
              </div>
            )}
            {/** mostrar quién creó la factura si existe */}
            {(data as any).createdBy && (
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Facturado por:</span>
                <span className={styles.valor}>{(data as any).createdBy.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información del Cliente */}
        <div className={`${styles.seccion} ${styles.cliente}`}>
          <h3>DATOS DEL CLIENTE</h3>
          <div className={styles.infoCliente}>
            <div className={styles.campo}>
              <span className={styles.etiqueta}>Nombre/Razón Social:</span>
              <span className={styles.valor}>{data.cliente.nombre}</span>
            </div>
            <div className={styles.campo}>
              <span className={styles.etiqueta}>RNC/Cédula:</span>
              <span className={styles.valor}>{data.cliente.rnc}</span>
            </div>
            <div className={styles.campo}>
              <span className={styles.etiqueta}>Dirección:</span>
              <span className={styles.valor}>{data.cliente.direccion}</span>
            </div>
            <div className={styles.campo}>
              <span className={styles.etiqueta}>Teléfono:</span>
              <span className={styles.valor}>{data.cliente.telefono}</span>
            </div>
          </div>
        </div>

        {/* Detalle de Productos/Servicios */}
        <div className={`${styles.seccion} ${styles.detalle}`}>
          <h3>DETALLE DE FACTURACIÓN</h3>
          <table className={styles.tablaDetalle}>
            <thead>
              <tr>
                <th>Descripción</th>
                <th className={styles.textRight}>Cantidad</th>
                <th className={styles.textRight}>Precio Unitario</th>
                <th className={styles.textRight}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.descripcion}</td>
                  <td className={styles.textRight}>{item.cantidad}</td>
                  <td className={styles.textRight}>{formatearMoneda(item.precioUnitario)}</td>
                  <td className={styles.textRight}>{formatearMoneda(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen Fiscal */}
        <div className={`${styles.seccion} ${styles.resumenFiscal}`}>
          <div className={styles.resumenDerecha}>
            <div className={styles.lineaResumen}>
              <span className={styles.etiquetaResumen}>Subtotal (Monto Bruto):</span>
              <span className={styles.valorResumen}>{formatearMoneda(data.resumenFiscal.montoBruto)}</span>
            </div>
            {data.requiereComprobanteFiscal && data.resumenFiscal.montoItbis > 0 && (
              <div className={styles.lineaResumen}>
                <span className={styles.etiquetaResumen}>ITBIS ({data.resumenFiscal.tasaItbis}%):</span>
                <span className={styles.valorResumen}>{formatearMoneda(data.resumenFiscal.montoItbis)}</span>
              </div>
            )}
            <div className={`${styles.lineaResumen} ${styles.lineaResumenDestacada}`}>
              <span className={styles.etiquetaResumen}>
                <strong>TOTAL A PAGAR:</strong>
              </span>
              <span className={styles.valorResumen}>
                <strong>{formatearMoneda(data.resumenFiscal.montoTotal)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Desglose del ITBIS - Solo si requiere comprobante fiscal */}
        {data.requiereComprobanteFiscal && data.resumenFiscal.montoItbis > 0 && (
          <div className={`${styles.seccion} ${styles.desgloseItbis}`}>
            <h3>DESGLOSE DEL IMPUESTO (ITBIS)</h3>
            <div className={styles.infoDesglose}>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Base Imponible:</span>
                <span className={styles.valor}>{formatearMoneda(data.resumenFiscal.montoBruto)}</span>
              </div>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Tasa de ITBIS:</span>
                <span className={styles.valor}>{data.resumenFiscal.tasaItbis}%</span>
              </div>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Monto de ITBIS:</span>
                <span className={styles.valor}>{formatearMoneda(data.resumenFiscal.montoItbis)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pie de Página */}
        <div className={styles.piePagina}>
          <p className={styles.notaLegal}>
            <strong>NOTA LEGAL:</strong> Este comprobante fiscal es válido según la normativa de la
            Dirección General de Impuestos Internos (DGII) de la República Dominicana.
          </p>
          <p className={styles.notaLegal}>
            Este documento ha sido generado electrónicamente y tiene validez fiscal.
          </p>
          <div className={styles.codigoQr}>
            <p>Código de Verificación: {data.comprobante.codigoVerificacion}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

