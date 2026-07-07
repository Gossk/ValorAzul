
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import './Toast.css'

type ToastType = 'success' | 'info' | 'error'

interface ToastAction {
  label: string
  to?: string
  onClick?: () => void
}

interface ShowToastInput {
  type?: ToastType
  title: string
  message: string
  action?: ToastAction
}

interface ToastItem extends ShowToastInput {
  id: number
  type: ToastType
}

interface ToastContextValue {
  showToast: (t: ShowToastInput) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback<ToastContextValue['showToast']>(
    (t) => {
      const id = Date.now() + Math.floor(Math.random() * 1000)
      const item: ToastItem = {
        id,
        type: t.type ?? 'info',
        title: t.title,
        message: t.message,
        action: t.action,
      }
      setToasts((prev) => [...prev, item])
      // Auto-cierre después de 6 s.
      window.setTimeout(() => remove(id), 6000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <div className="toast-icon">
                <Icon size={20} />
              </div>
              <div className="toast-body">
                <strong className="toast-title">{t.title}</strong>
                <p className="toast-message">{t.message}</p>
                {t.action && (
                  <div className="toast-actions">
                    {t.action.to ? (
                      <Link
                        className="toast-action"
                        to={t.action.to}
                        onClick={() => remove(t.id)}
                      >
                        {t.action.label}
                      </Link>
                    ) : (
                      <button
                        className="toast-action"
                        onClick={() => {
                          t.action?.onClick?.()
                          remove(t.id)
                        }}
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button
                className="toast-close"
                onClick={() => remove(t.id)}
                aria-label="Cerrar notificación"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
