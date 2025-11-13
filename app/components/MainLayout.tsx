'use client'

import Sidebar from './Sidebar'
import styles from './MainLayout.module.css'
import UserMenu from './UserMenu'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // If auth initialized and no user, redirect to /login (except when already at /login)
    if (!auth.loading && !auth.user && pathname !== '/login') {
      router.push('/login')
    }
  }, [auth.loading, auth.user, pathname, router])

  if (auth.loading) {
    return <div style={{padding:20}}>Cargando...</div>
  }
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div style={{display:'flex', justifyContent:'flex-end', padding:'0.5rem 1rem'}}>
          <UserMenu />
        </div>
        {children}
      </main>
    </div>
  )
}

