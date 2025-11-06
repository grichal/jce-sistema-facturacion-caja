'use client'

import Sidebar from './Sidebar'
import styles from './MainLayout.module.css'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}

