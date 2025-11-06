'use client'

import React, { useState, useCallback } from 'react'
import ToastComponent, { Toast, ToastType } from './Toast'
import styles from './ToastContainer.module.css'

interface ToastContainerProps {
  children: React.ReactNode
}

export interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

export const ToastContext = React.createContext<ToastContextValue | null>(null)

export default function ToastContainer({ children }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType, duration?: number) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      }
      setToasts((prev) => [...prev, newToast])
    },
    []
  )

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  )

  const showError = useCallback(
    (message: string) => showToast(message, 'error', 7000),
    [showToast]
  )

  const showWarning = useCallback(
    (message: string) => showToast(message, 'warning'),
    [showToast]
  )

  const showInfo = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast]
  )

  const contextValue: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

