'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/app/components/MainLayout'
import { useAuth } from '@/app/components/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ReporteCierreDetalle() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const auth = useAuth()
  const params = useSearchParams()
  const router = useRouter()
  const id = params?.get('id') || ''

  useEffect(() => {
    if (!auth.loading && (!auth.user || auth.user.role !== 'admin')) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const pathId = id || window.location.pathname.split('/').pop()
        const res = await fetch(`/api/caja/reportes/${pathId}`)
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [auth.loading, auth.user, id])

  // Auto-print when opened with ?print=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldPrint = params.get('print') === '1'
    if (shouldPrint && !loading) {
      // small timeout to ensure content rendered
      setTimeout(() => {
        window.print()
      }, 400)
    }
  }, [loading])

  if (auth.loading || loading) return <MainLayout><div style={{padding:20}}>Cargando...</div></MainLayout>

  if (!auth.user || auth.user.role !== 'admin') {
    return (
      <MainLayout>
        <div style={{padding:20}} className="card">
          <h2>No autorizado</h2>
        </div>
      </MainLayout>
    )
  }

  const imprimir = () => window.print()

  return (
    <MainLayout>
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1>Reporte de Cierre</h1>
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn-secondary" onClick={imprimir}>Imprimir</button>
            <button className="btn btn-primary" onClick={imprimir}>Exportar PDF</button>
          </div>
        </div>

        {!data && <p className="muted">No hay datos para este reporte.</p>}

        {data && (
          <div style={{marginTop:12}}>
            <p><strong>Fecha:</strong> {data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : data.fecha}</p>
            <p><strong>Cajero:</strong> {(data.usuario && data.usuario.username) || data.usuario || 'N/A'}</p>
            <p><strong>Efectivo Inicial:</strong> {data.efectivoInicial ?? 'N/A'}</p>
            <p><strong>Efectivo Final:</strong> {data.efectivoFinal ?? 'N/A'}</p>
            <p><strong>Total Ventas:</strong> {data.totalVentas ?? 'N/A'}</p>

            <h3 style={{marginTop:16}}>Detalle por método de pago</h3>
            <table>
              <thead>
                <tr><th>Método</th><th className="text-right">Total</th></tr>
              </thead>
              <tbody>
                <tr><td>Efectivo</td><td className="text-right">{data.totalEfectivo ?? 0}</td></tr>
                <tr><td>Tarjeta</td><td className="text-right">{data.totalTarjeta ?? 0}</td></tr>
              </tbody>
            </table>

            {data.notas && (
              <div style={{marginTop:12}}>
                <h4>Notas</h4>
                <p className="muted">{data.notas}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
