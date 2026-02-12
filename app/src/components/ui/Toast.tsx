import { useState, useCallback, createContext, useContext } from 'react'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextValue {
  toast: (message: string, type?: ToastMessage['type']) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const bgColors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#3b82f6',
    warning: '#f59e0b',
  }

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[1000] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="px-4 py-3 rounded-md text-white font-medium text-sm animate-[slideIn_0.3s_ease-out]"
            style={{ background: bgColors[t.type] }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
