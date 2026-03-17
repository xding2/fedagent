/**
 * 聊天输入框 — 级别选择器 + 输入 + 快捷操作
 */
import React, { useState, useRef, useCallback } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { useT } from '../i18n'
import LevelSelector from './LevelSelector'

interface ChatInputProps {
  onSubmit: (text: string) => void
  onCommand: (cmd: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSubmit, onCommand, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [confirmStop, setConfirmStop] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const currentTask = useTaskStore(s => s.currentTask)
  const t = useT()

  const isTaskActive = currentTask && !['completed', 'enacted', 'unconstitutional', 'tabled', 'blocked'].includes(currentTask.state)
  const isHighLevel = currentTask && (currentTask.level === 'L3' || currentTask.level === 'L4')

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setText('')
    inputRef.current?.focus()
  }, [text, disabled, onSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleStop = () => {
    if (confirmStop) {
      onCommand('stop')
      setConfirmStop(false)
    } else {
      setConfirmStop(true)
      setTimeout(() => setConfirmStop(false), 3000)
    }
  }

  return (
    <div className="space-y-2">
      {/* Quick actions (only during active task) */}
      {isTaskActive && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-600 mr-1">{t('input.actions')}</span>

          <button
            onClick={() => onCommand('fast')}
            disabled={!isHighLevel}
            title={t('input.fast_track_tip')}
            aria-label={t('input.fast_track')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all
              text-amber-400/80 hover:bg-amber-500/10 border border-amber-500/15
              disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <span>⚡</span> {t('input.fast_track')}
          </button>

          <button
            onClick={() => onCommand('skip')}
            disabled={!isTaskActive}
            title={t('input.skip_tip')}
            aria-label={t('input.skip')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all
              text-blue-400/80 hover:bg-blue-500/10 border border-blue-500/15
              disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <span>⏭</span> {t('input.skip')}
          </button>

          <button
            onClick={handleStop}
            title={t('input.stop_tip')}
            aria-label={t('input.stop')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg transition-all
              border ${confirmStop
                ? 'text-red-300 bg-red-500/20 border-red-500/30'
                : 'text-red-400/80 hover:bg-red-500/10 border-red-500/15'
              }`}
          >
            <span>⏹</span> {confirmStop ? t('input.confirm_stop') : t('input.stop')}
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <LevelSelector />

        <textarea
          ref={inputRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={t('input.placeholder')}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2
            text-sm text-gray-100 resize-none
            focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30
            placeholder-gray-500 disabled:opacity-40
            transition-all duration-200"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-500 hover:to-indigo-500
            disabled:from-gray-700 disabled:to-gray-700
            text-white text-sm font-medium rounded-xl
            transition-all duration-200 disabled:opacity-40
            shadow-lg shadow-blue-500/20 disabled:shadow-none
            flex items-center gap-1.5 shrink-0"
        >
          {disabled ? (
            <span className="dot-pulse" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {t('input.send')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
