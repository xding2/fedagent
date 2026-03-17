/**
 * 任务级别选择器
 */
import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useT } from '../i18n'

export default function LevelSelector() {
  const selectedLevel = useUIStore(s => s.selectedLevel)
  const setSelectedLevel = useUIStore(s => s.setSelectedLevel)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const t = useT()

  const LEVELS = [
    { value: 'auto', label: t('level.auto'), desc: t('level.auto_desc'), color: 'text-gray-400' },
    { value: 'L1', label: 'L1', desc: t('level.l1_desc'), color: 'text-amber-400' },
    { value: 'L2', label: 'L2', desc: t('level.l2_desc'), color: 'text-blue-400' },
    { value: 'L3', label: 'L3', desc: t('level.l3_desc'), color: 'text-purple-400' },
    { value: 'L4', label: 'L4', desc: t('level.l4_desc'), color: 'text-red-400' },
  ] as const

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = LEVELS.find(l => l.value === selectedLevel) || LEVELS[0]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
          hover:bg-white/5 transition-colors border border-white/5 ${current.color}`}
        title={t('level.title')}
      >
        {current.label}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in">
          {LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => { setSelectedLevel(level.value as typeof selectedLevel); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors
                flex items-center gap-3 ${selectedLevel === level.value ? 'bg-white/5' : ''}`}
            >
              <span className={`font-medium text-xs w-8 ${level.color}`}>{level.label}</span>
              <span className="text-gray-400 text-xs">{level.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
