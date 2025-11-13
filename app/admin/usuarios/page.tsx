'use client'

import MainLayout from '../../../app/components/MainLayout'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../app/components/AuthProvider'
import styles from '../../../app/cierre-caja/page.module.css'

export default function UsuariosAdminPage() {
  const auth = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin'|'user'>('user')
  const [edits, setEdits] = useState<Record<string, { displayName?: string; password?: string }>>({})

  useEffect(() => {
    if (!auth.user || auth.user.role !== 'admin') return
    load()
  }, [auth.user])

  async function load() {
    setLoading(true)
    try {
      const list = await auth.listUsers()
      setUsers(list)
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  async function handleCreate() {
    try {
      await auth.createUser({ username, password, role, displayName: username })
      setUsername('')
      setPassword('')
      setRole('user')
      load()
    } catch (err) { console.error(err) }
  }

  async function changeRole(id: string, to: 'admin'|'user') {
    await auth.updateUserRole(id, to)
    load()
  }

  async function removeUser(id: string) {
    await auth.deleteUser(id)
    load()
  }

  async function saveEdit(id: string) {
    const e = edits[id]
    if (!e) return
    try {
      await auth.updateUser(id, { displayName: e.displayName, password: e.password })
      setEdits((prev) => { const copy = { ...prev }; delete copy[id]; return copy })
      load()
    } catch (err) { console.error(err) }
  }

  if (!auth.user) return <MainLayout><div style={{padding:20}}>Accede para ver esta página</div></MainLayout>
  if (auth.user.role !== 'admin') return <MainLayout><div style={{padding:20}}>No tienes permisos para ver esta página</div></MainLayout>

  return (
    <MainLayout>
      <div className={styles.container}>
        <h1>Administrar Usuarios</h1>
        <div className={styles.card}>
          <h3>Crear Usuario</h3>
          <div style={{display:'flex', gap:8}}>
            <input placeholder="usuario" value={username} onChange={(e)=>setUsername(e.target.value)} />
            <input placeholder="contraseña" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <select value={role} onChange={(e)=>setRole(e.target.value as any)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={handleCreate}>Crear</button>
          </div>

          <h3 style={{marginTop: '1rem'}}>Usuarios</h3>
          {loading ? <div>Cargando...</div> : (
            <table style={{width:'100%'}}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Contraseña</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u=> (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>
                      <input
                        value={edits[u.id]?.displayName ?? u.displayName ?? ''}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), displayName: e.target.value } }))}
                      />
                    </td>
                    <td>
                      {u.role}
                    </td>
                    <td>
                      <input
                        placeholder="Nueva contraseña"
                        value={edits[u.id]?.password ?? ''}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [u.id]: { ...(prev[u.id] || {}), password: e.target.value } }))}
                      />
                    </td>
                    <td>
                      <div style={{display:'flex', gap:8}}>
                        {u.role !== 'admin' && <button onClick={()=>changeRole(u.id,'admin')}>Hacer admin</button>}
                        {u.role !== 'user' && <button onClick={()=>changeRole(u.id,'user')}>Hacer user</button>}
                        <button onClick={()=>saveEdit(u.id)}>Guardar</button>
                        <button onClick={()=>removeUser(u.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
