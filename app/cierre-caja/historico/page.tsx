'use client'

import MainLayout from '../../components/MainLayout'
import styles from '../page.module.css'
import { useEffect, useRef, useState } from 'react'
import { listCierres } from '../../../lib/firebase/cierre'

export default function HistoricoCierresPage() {
  const [cierres, setCierres] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const printableRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function cargar() {
      try {
        const items = await listCierres(500)
        setCierres(items)
      } catch (err) {
        console.error('Error cargando cierres:', err)
      }
    }
    cargar()
  }, [])

  const generarPDF = async () => {
    if (!printableRef.current) return
    setBusy(true)
    try {
      const html2canvasModule = await import('html2canvas')
      const { jsPDF } = await import('jspdf')
      const html2canvas = (html2canvasModule && (html2canvasModule.default || html2canvasModule)) as any

      // render element to canvas (scale for better quality)
      const canvas = await html2canvas(printableRef.current, { scale: 2 })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgData = canvas.toDataURL('image/png')
      const cw = canvas.width
      const ch = canvas.height

      // calculate slice height in pixels corresponding to one PDF page
      const slicePx = Math.floor((pageHeight * cw) / pageWidth)

      let y = 0
      let first = true
      while (y < ch) {
        const h = Math.min(slicePx, ch - y)
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = cw
        sliceCanvas.height = h
        const ctx = sliceCanvas.getContext('2d')!
        ctx.drawImage(canvas, 0, y, cw, h, 0, 0, cw, h)
        const sliceData = sliceCanvas.toDataURL('image/png')

        const imgHeightMm = (h * pageWidth) / cw

        if (!first) pdf.addPage()
        pdf.addImage(sliceData, 'PNG', 0, 0, pageWidth, imgHeightMm)

        y += h
        first = false
      }

      pdf.save(`historico-cierres-${Date.now()}.pdf`)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error generando PDF. Revisa la consola.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1>Histórico de Cierres</h1>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }} className="no-print">
            <button onClick={generarPDF} className="btn btn-primary" disabled={busy}>{busy ? 'Generando...' : 'Generar PDF'}</button>
          </div>

          {cierres.length === 0 ? (
            <p>No hay cierres registrados.</p>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Efectivo Inicial</th>
                    <th>Efectivo Final</th>
                    <th>Total Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.map((c) => (
                    <tr key={c.id}>
                      <td>{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleString() : (c.fecha ? new Date(c.fecha).toLocaleString() : '-')}</td>
                      <td>{(c.usuario && (c.usuario.username || c.usuario)) || '-'}</td>
                      <td>{c.efectivoInicial ?? 0}</td>
                      <td>{c.efectivoFinal ?? 0}</td>
                      <td>{c.totalVentas ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Hidden/offscreen printable content captured by html2canvas */}
              <div ref={printableRef as any} style={{ position: 'absolute', left: -9999, top: 0, width: '210mm', padding: 20, background: '#fff' }}>
                <h2 style={{ textAlign: 'center' }}>Reporte Histórico de Cierres</h2>
                <p style={{ textAlign: 'center' }} className="muted">Generado: {new Date().toLocaleString()}</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Cajero</th>
                      <th>Efectivo Inicial</th>
                      <th>Efectivo Final</th>
                      <th>Total Ventas</th>
                      <th>Total Efectivo</th>
                      <th>Total Tarjeta</th>
                      <th>Comentarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cierres.map((c) => (
                      <tr key={c.id}>
                        <td>{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleString() : (c.fecha || '-')}</td>
                        <td>{(c.usuario && (c.usuario.username || c.usuario)) || '-'}</td>
                        <td className="text-right">{c.efectivoInicial ?? '-'}</td>
                        <td className="text-right">{c.efectivoFinal ?? '-'}</td>
                        <td className="text-right">{c.totalVentas ?? '-'}</td>
                        <td className="text-right">{c.totalEfectivo ?? '-'}</td>
                        <td className="text-right">{c.totalTarjeta ?? '-'}</td>
                        <td>{c.comentarios ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
