import { collection, addDoc, getDocs, query, where, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './config'

export interface Usuario {
  id?: string
  username: string
  password: string // NOTE: plain text for task/demo only
  displayName?: string
  role: 'admin' | 'user'
}

function ensureDb() {
  if (!db) throw new Error('Firestore no inicializado')
  return db
}

export async function getUserByUsername(username: string): Promise<Usuario | null> {
  const database = ensureDb()
  const col = collection(database, 'Usuarios')
  const q = query(col, where('username', '==', username))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...(docSnap.data() as any) } as Usuario
}

export async function createUser(user: Omit<Usuario, 'id'>): Promise<{ id: string }> {
  const database = ensureDb()
  const col = collection(database, 'Usuarios')
  const docRef = await addDoc(col, user)
  return { id: docRef.id }
}

export async function listUsers(): Promise<Usuario[]> {
  const database = ensureDb()
  const col = collection(database, 'Usuarios')
  const snap = await getDocs(col)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Usuario[]
}

export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  const database = ensureDb()
  const userRef = doc(database, 'Usuarios', userId)
  await updateDoc(userRef, { role })
}

export async function deleteUser(userId: string) {
  const database = ensureDb()
  const userRef = doc(database, 'Usuarios', userId)
  await deleteDoc(userRef)
}

export async function updateUser(userId: string, updates: Partial<Omit<Usuario, 'id'>>) {
  const database = ensureDb()
  const userRef = doc(database, 'Usuarios', userId)
  await updateDoc(userRef, updates as any)
}

export async function ensureDefaultAdmin() {
  // Create default admin user if none exists
  const existing = await getUserByUsername('admin')
  if (!existing) {
    try {
      // Default password set to 'admin' for this task as requested
      await createUser({ username: 'admin', password: 'admin', displayName: 'Administrator', role: 'admin' })
      console.log('Default admin created (username: admin, password: admin)')
    } catch (err) {
      console.error('Error creating default admin:', err)
    }
  } else {
    // If an admin user exists but has a different password, update it to the requested default
    try {
      if (existing.password !== 'admin') {
        const database = ensureDb()
        const userRef = doc(database, 'Usuarios', existing.id!)
        await updateDoc(userRef, { password: 'admin' })
        console.log('Default admin password corrected to "admin"')
      }
    } catch (err) {
      console.error('Error ensuring default admin password:', err)
    }
  }
}
