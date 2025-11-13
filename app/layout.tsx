import type { Metadata } from 'next'
import './globals.css'
import ToastContainer from './components/ToastContainer'
import AuthProvider from './components/AuthProvider'

export const metadata: Metadata = {
  title: 'Sistema de Facturación Fiscal',
  description: 'Sistema de Facturación Fiscal - Gestión de Servicios y Comprobantes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ToastContainer>{children}</ToastContainer>
        </AuthProvider>
      </body>
    </html>
  )
}

