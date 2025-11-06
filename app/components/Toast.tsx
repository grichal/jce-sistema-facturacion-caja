'use client'

import { useEffect } from 'react'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const duration = toast.duration || 5000
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return 'ℹ'
    }
  }

  return (
    <div
      className={`${styles.toast} ${styles[`toast${toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}`]}`}
      onClick={() => onClose(toast.id)}
    >
      <div className={styles.toastIcon}>{getIcon()}</div>
      <div className={styles.toastMessage}>{toast.message}</div>
      <button
        className={styles.toastClose}
        onClick={(e) => {
          e.stopPropagation()
          onClose(toast.id)
        }}
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}

