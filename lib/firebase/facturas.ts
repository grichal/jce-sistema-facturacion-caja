import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from './config'

interface FacturaResumen {
  id?: string
  fecha?: string
  metodoPago?: string | null
  montoTotal: number
  requiereComprobanteFiscal?: boolean
}

function ensureDb() {
  if (!db) throw new Error('Firestore no inicializado')
  return db
}

export async function listFacturasInRange(startIso: string, endIso: string): Promise<FacturaResumen[]> {
  const database = ensureDb()
  const col = collection(database, 'Facturas')
  // Assuming each factura document has a 'createdAt' field of type Timestamp
  const q = query(col, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  const results: FacturaResumen[] = []
  snap.forEach((doc) => {
    const data = doc.data() as any
    const created = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
    const createdIso = created ? new Date(created).toISOString() : null
    if (!createdIso) return
    if (createdIso >= startIso && createdIso <= endIso) {
      results.push({
        id: doc.id,
        fecha: createdIso,
        metodoPago: data.metodoPago || null,
        montoTotal: data.resumenFiscal?.montoTotal ?? 0,
        requiereComprobanteFiscal: data.requiereComprobanteFiscal,
      })
    }
  })
  return results
}

export async function summarizeFacturasInRange(startIso: string, endIso: string) {
  const facturas = await listFacturasInRange(startIso, endIso)
  const resumen = {
    totalVentas: 0,
    efectivo: 0,
    tarjeta: 0,
    count: facturas.length,
  }

  for (const f of facturas) {
    resumen.totalVentas += f.montoTotal
    if (f.metodoPago === 'efectivo') resumen.efectivo += f.montoTotal
    if (f.metodoPago === 'tarjeta') resumen.tarjeta += f.montoTotal
  }

  return resumen
}

export async function getFacturaById(id: string) {
  const database = ensureDb()
  const col = collection(database, 'Facturas')
  const snap = await getDocs(query(col, where('__name__', '==', id)))
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as any) }
}

export async function getLatestFactura() {
  const database = ensureDb()
  const col = collection(database, 'Facturas')
  const q = query(col, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as any) }
}
