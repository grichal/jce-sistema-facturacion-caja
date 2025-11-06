'use client'

import { useContext } from 'react'
import { ToastContext, ToastContextValue } from '../components/ToastContainer'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastContainer')
  }
  
  return context
}

