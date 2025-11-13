 'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'
import { useAuth } from './AuthProvider'

interface MenuItem {
  name: string
  path: string
  icon?: string
}

const menuItems: MenuItem[] = [
  {
    name: 'Servicios',
    path: '/servicios',
    icon: '📋',
  },
  {
    name: 'Tipos de Servicios',
    path: '/tipos-de-servicios',
    icon: '🏷️',
  },
  {
    name: 'Facturación',
    path: '/facturacion',
    icon: '💰',
  },
  {
    name: 'Cierre de Caja',
    path: '/cierre-caja',
    icon: '🔐',
  },
  {
    name: 'Historial Cierres',
    path: '/cierre-caja/historico',
    icon: '📜',
  },
  // Aquí puedes agregar más opciones del menú en el futuro
  // {
  //   name: 'Clientes',
  //   path: '/clientes',
  //   icon: '👥',
  // },
]

export default function Sidebar() {
  const pathname = usePathname()
  const auth = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <Image src="/jce-logo.svg" alt="JCE" width={56} height={84} />
          <div>
            <h2 className={styles.logo}>Sistema de Facturación</h2>
            <div className={styles.logoSub}>Caja - JCE</div>
          </div>
        </div>
      </div>
      <nav className={styles.nav}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.path} className={styles.menuItem}>
              <Link
                href={item.path}
                className={`${styles.menuLink} ${
                  pathname === item.path ? styles.active : ''
                }`}
              >
                {item.icon && <span className={styles.icon}>{item.icon}</span>}
                <span className={styles.menuText}>{item.name}</span>
              </Link>
            </li>
          ))}

          <li key="/admin/usuarios" className={styles.menuItem}>
            <Link
              href={'/admin/usuarios'}
              className={`${styles.menuLink} ${
                pathname === '/admin/usuarios' ? styles.active : ''
              }`}
            >
              <span className={styles.icon}>🛠️</span>
              <span className={styles.menuText}>Administrar Usuarios</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

