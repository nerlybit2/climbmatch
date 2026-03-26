'use client'
import { createContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

export interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    clearTimeout(timersRef.current.get(id))
    timersRef.current.delete(id)
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3000) => {
    const id = String(++counterRef.current)
    setToasts(prev => [...prev.slice(-2), { id, message, variant }])
    const timer = setTimeout(() => removeToast(id), duration)
    timersRef.current.set(id, timer)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}
