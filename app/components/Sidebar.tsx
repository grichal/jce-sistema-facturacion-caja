'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

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
  // Aquí puedes agregar más opciones del menú en el futuro
  // {
  //   name: 'Clientes',
  //   path: '/clientes',
  //   icon: '👥',
  // },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.logo}>Sistema de Facturación</h2>
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
        </ul>
      </nav>
    </aside>
  )
}

