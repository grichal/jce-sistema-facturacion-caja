'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/app/components/MainLayout'
import styles from './page.module.css'
import { useAuth } from '@/app/components/AuthProvider'
import Link from 'next/link'

interface CierreBrief {
  id: string
  fecha?: string
  createdAt?: any
  usuario?: string
  usuarioId?: string
}

export default function CajaHistorialPage() {
  const [reportes, setReportes] = useState<CierreBrief[]>([])
  const [loading, setLoading] = useState(true)
  const auth = useAuth()

  useEffect(() => {
    if (!auth.loading && (!auth.user || auth.user.role !== 'admin')) {
      // not authorized
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await fetch('/api/caja/reportes')
        const json = await res.json()
        if (json.success) setReportes(json.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [auth.loading, auth.user])

  if (auth.loading || loading) return <MainLayout><div style={{padding:20}}>Cargando...</div></MainLayout>

  if (!auth.user || auth.user.role !== 'admin') {
    return (
      <MainLayout>
        <div style={{padding:20}} className="card">
          <h2>No autorizado</h2>
          <p>Solo el Gerente Financiero puede acceder a los reportes de cierre.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="card">
        <h1>Historial de Cierres</h1>
        <p className="muted">Listado de cierres con opción para ver reporte detallado e imprimir/exportar.</p>

        <table style={{marginTop:12}}>
          <thead>
            <tr>
              <th>Fecha/Hora de Cierre</th>
              <th>Cajero Responsable</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map(r => (
              <tr key={r.id}>
                <td>{r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleString() : r.fecha || 'N/A'}</td>
                <td>{(r as any).usuario || (r as any).usuario?.username || 'N/A'}</td>
                <td style={{display:'flex', gap:8}}>
                  <Link href={`/caja/historial/${r.id}`} className="btn btn-ghost">Ver reporte</Link>
                  <a className="btn btn-primary" href={`/caja/historial/${r.id}?print=1`} target="_blank" rel="noreferrer">Exportar PDF</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  )
}
