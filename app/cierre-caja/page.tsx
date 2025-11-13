'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthProvider'
import MainLayout from '../components/MainLayout'
import styles from './page.module.css'
import { useToast } from '../hooks/useToast'
import { createCierre } from '../../lib/firebase/cierre'
import { summarizeFacturasInRange } from '../../lib/firebase/facturas'
import { listCierres } from '../../lib/firebase/cierre'

export default function CierreCajaPage() {
  const [efectivoInicial, setEfectivoInicial] = useState<number | ''>('')
  const [efectivoFinal, setEfectivoFinal] = useState<number | ''>('')
  const [comentarios, setComentarios] = useState('')
  const [totales, setTotales] = useState({ totalVentas: 0, efectivo: 0, tarjeta: 0, count: 0 })
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const auth = useAuth()

  async function handleGuardar() {
    setLoading(true)
    try {
      const payload = {
        fecha: new Date().toISOString(),
        usuario: auth.user ? auth.user.username : 'usuario-de-tarea',
        usuarioId: auth.user ? auth.user.id : null,
        efectivoInicial: typeof efectivoInicial === 'number' ? efectivoInicial : 0,
        efectivoFinal: typeof efectivoFinal === 'number' ? efectivoFinal : 0,
        totalVentas: totales.totalVentas ?? 0,
        totalEfectivo: totales.efectivo ?? 0,
        totalTarjeta: totales.tarjeta ?? 0,
        comentarios,
      }

      const res = await createCierre(payload)
      toast.showSuccess(`Cierre guardado (id: ${res.id})`)
      setEfectivoInicial('')
      setEfectivoFinal('')
      setComentarios('')
    } catch (err: any) {
      console.error(err)
      toast.showError('Error guardando cierre')
    } finally {
      setLoading(false)
    }
  }

  // Cargar resumen de facturas del día y prefills
  useEffect(() => {
    async function cargarResumen() {
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
        // resumir facturas
        if (typeof window !== 'undefined') {
          const resumen = await summarizeFacturasInRange(start, end)
          setTotales(resumen as any)
          // Autocalcular efectivo final estimado: si hay un ultimo cierre, usar su efectivoFinal como inicial
          try {
            const ultimos = await listCierres(1)
            if (ultimos && ultimos.length > 0) {
              const ultimo = ultimos[0]
              setEfectivoInicial(ultimo.efectivoFinal ?? 0)
              // estimar efectivoFinal = efectivoInicial + efectivo ingresado
              setEfectivoFinal((ultimo.efectivoFinal ?? 0) + (resumen.efectivo ?? 0))
            } else {
              // no hay cierres previos: efectivo inicial 0
              setEfectivoInicial(0)
              setEfectivoFinal(resumen.efectivo ?? 0)
            }
          } catch (err) {
            console.error('Error cargando último cierre:', err)
          }
        }
      } catch (err) {
        console.error('Error cargando resumen de facturas:', err)
      }
    }

    cargarResumen()
  }, [])

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1>Cierre de Caja</h1>

        <div style={{marginBottom: '0.75rem'}}>
          <strong>Resumen del periodo (hoy):</strong>
          <div style={{display:'flex', gap: '1rem', marginTop: '0.5rem'}}>
            <div>Total Ventas: <strong>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(totales.totalVentas)}</strong></div>
            <div>Efectivo: <strong>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(totales.efectivo)}</strong></div>
            <div>Tarjeta: <strong>{new Intl.NumberFormat('es-DO', {style:'currency', currency:'DOP'}).format(totales.tarjeta)}</strong></div>
            <div>Facturas: <strong>{totales.count}</strong></div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.row}>
            <div style={{flex:1}}>
              <div className={styles.label}>Efectivo Inicial</div>
              <input
                className={styles.input}
                type="number"
                value={efectivoInicial}
                onChange={(e) => setEfectivoInicial(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div style={{flex:1}}>
              <div className={styles.label}>Efectivo Final</div>
              <input
                className={styles.input}
                type="number"
                value={efectivoFinal}
                onChange={(e) => setEfectivoFinal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div style={{marginBottom: '0.75rem'}}>
            <div className={styles.label}>Comentarios</div>
            <textarea
              className={styles.input}
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleGuardar} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cierre'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
