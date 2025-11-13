'use client'

import { useEffect, useState } from 'react'
import MainLayout from '../../../components/MainLayout'
import { listCierres } from '../../../../lib/firebase/cierre'

export default function ReporteHistoricoCierres() {
  const [cierres, setCierres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const items = await listCierres(500)
        setCierres(items)
      } catch (err) {
        console.error('Error cargando cierres para reporte:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldPrint = params.get('print') === '1'
    if (shouldPrint && !loading) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading])

  return (
    <MainLayout>
      <div style={{padding:20}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <h1>Reporte Histórico de Cierres</h1>
            <p className="muted">Generado: {new Date().toLocaleString()}</p>
          </div>
          <div>
            <p className="muted">Junta Central Electoral</p>
          </div>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div style={{marginTop:12}} className="card">
            <table>
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
                    <td>{(c.usuario && c.usuario.username) || c.usuario || '-'}</td>
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
        )}
      </div>
    </MainLayout>
  )
}
