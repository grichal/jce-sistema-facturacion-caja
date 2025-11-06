import MainLayout from './components/MainLayout'
import styles from './page.module.css'

export default function Home() {
  return (
    <MainLayout>
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Bienvenido al Sistema de Facturación</h1>
        <p className={styles.subtitle}>
          Selecciona una opción del menú lateral para comenzar
        </p>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h2>📋 Servicios</h2>
            <p>Gestiona los servicios disponibles en el sistema</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
