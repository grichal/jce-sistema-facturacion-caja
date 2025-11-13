import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from './config'
import type { CierreCaja, NewCierre } from './models'

const COLLECTION_NAME = 'cierres'

function ensureDb() {
  if (!db) throw new Error('Firestore no inicializado')
  return db
}

export async function createCierre(payload: NewCierre): Promise<{ id: string }>{
  const database = ensureDb()
  const col = collection(database, COLLECTION_NAME)
  const docRef = await addDoc(col, { ...payload, createdAt: serverTimestamp() })
  return { id: docRef.id }
}

export async function listCierres(limitCount = 20): Promise<CierreCaja[]> {
  const database = ensureDb()
  const col = collection(database, COLLECTION_NAME)
  const q = query(col, orderBy('createdAt', 'desc'), limit(limitCount))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
}

export async function getCierreById(id: string): Promise<CierreCaja | null> {
  const database = ensureDb()
  const ref = doc(database, COLLECTION_NAME, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as any) } as CierreCaja
}
