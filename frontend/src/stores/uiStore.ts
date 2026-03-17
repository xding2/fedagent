/**
 * UI 状态管理
 */
import { create } from 'zustand'
import type { Locale } from '../i18n'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface UIStore {
  locale: Locale
  selectedLevel: 'auto' | 'L1' | 'L2' | 'L3' | 'L4'
  showOnboarding: boolean
  showSidebar: boolean
  showAgentPanel: boolean
  toasts: Toast[]

  setLocale: (locale: Locale) => void
  setSelectedLevel: (level: UIStore['selectedLevel']) => void
  setShowOnboarding: (show: boolean) => void
  toggleSidebar: () => void
  toggleAgentPanel: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  locale: (localStorage.getItem('fedagent_locale') as Locale) || 'zh',
  selectedLevel: 'auto',
  showOnboarding: !localStorage.getItem('fedagent_onboarded'),
  showSidebar: true,
  showAgentPanel: true,
  toasts: [],

  setLocale: (locale) => {
    localStorage.setItem('fedagent_locale', locale)
    set({ locale })
  },

  setSelectedLevel: (level) => set({ selectedLevel: level }),

  setShowOnboarding: (show) => {
    if (!show) localStorage.setItem('fedagent_onboarded', '1')
    set({ showOnboarding: show })
  },

  toggleSidebar: () => set(s => ({ showSidebar: !s.showSidebar })),
  toggleAgentPanel: () => set(s => ({ showAgentPanel: !s.showAgentPanel })),

  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, toast.duration || 5000)
  },

  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),
}))
