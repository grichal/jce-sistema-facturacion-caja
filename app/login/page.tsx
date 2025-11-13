'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { useRouter } from 'next/navigation'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../components/AuthProvider'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const router = useRouter()
  const auth = useAuth()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await auth.signIn(username, password)
    setLoading(false)
    if (ok) {
      toast.showSuccess('Ingreso correcto')
      router.push('/')
    } else {
      toast.showError('Usuario o contraseña inválidos')
    }
  }

  return (
    <div style={{maxWidth:400, margin:'2rem auto'}}>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={submit}>
        <div style={{marginBottom: '0.5rem'}}>
          <label>Usuario</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className={styles.input} />
        </div>
        <div style={{marginBottom: '0.5rem'}}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} />
        </div>
        <div>
          <button className={styles.btnPrimary} type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </div>
      </form>
    </div>
  )
}
