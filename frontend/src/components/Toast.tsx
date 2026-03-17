/**
 * Toast 通知系统
 */
import { useUIStore, Toast } from '../stores/uiStore'

export default function ToastContainer() {
  const toasts = useUIStore(s => s.toasts)
  const removeToast = useUIStore(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  }
  const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' }

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl border
        backdrop-blur-xl text-sm animate-slide-up cursor-pointer ${colors[toast.type]}`}
      onClick={onDismiss}
    >
      <span className="text-base">{icons[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  )
}
