/**
 * 底部状态栏 — 36px 毛玻璃条
 */
import { useTaskStore } from '../stores/taskStore'
import { useAgentStore } from '../stores/agentStore'
import { useUIStore } from '../stores/uiStore'
import { useT, getAgentName, getStateLabel } from '../i18n'

const LEVEL_COLORS: Record<string, string> = {
  L1: 'bg-emerald-500/15 text-emerald-400',
  L2: 'bg-blue-500/15 text-blue-400',
  L3: 'bg-amber-500/15 text-amber-400',
  L4: 'bg-red-500/15 text-red-400',
}

interface StatusBarProps {
  connected: boolean
}

export default function StatusBar({ connected }: StatusBarProps) {
  const task = useTaskStore(s => s.currentTask)
  const agents = useAgentStore(s => s.agents)
  const setShowOnboarding = useUIStore(s => s.setShowOnboarding)
  const t = useT()

  const activeAgents = Object.values(agents).filter(a => a.state !== 'idle')

  const levelLabel = task ? t(`status.${task.level.toLowerCase()}`) : ''

  return (
    <div className="h-9 glass flex items-center px-4 gap-3 text-xs border-t border-white/5">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-dot-pulse' : 'bg-red-400'}`} />
        <span className="text-gray-500">{connected ? t('status.connected') : t('status.disconnected')}</span>
      </div>

      {/* Task info */}
      {task && (
        <>
          <div className="w-px h-3 bg-white/10" />
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${LEVEL_COLORS[task.level] || 'bg-gray-500/15 text-gray-400'}`}>
            {levelLabel || task.level}
          </span>
          <span className="text-gray-400 text-[11px]">
            {getStateLabel(task.state) || task.state_label || task.state}
          </span>
          {task.current_agent && (
            <span className="text-blue-400 text-[11px]">
              {getAgentName(task.current_agent)}
            </span>
          )}
          <span className="text-gray-600 text-[10px] font-mono">
            {task.total_transitions || 0}/15
          </span>
        </>
      )}

      {/* Active agents */}
      {activeAgents.length > 0 && (
        <>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5">
            {activeAgents.slice(0, 5).map(a => (
              <span
                key={a.id}
                className="text-[10px] text-amber-400/70"
                title={`${getAgentName(a.id)} (${a.state})`}
              >
                {getAgentName(a.id)}
              </span>
            ))}
            {activeAgents.length > 5 && (
              <span className="text-gray-600 text-[10px]">+{activeAgents.length - 5}</span>
            )}
          </div>
        </>
      )}

      {/* Right: help button */}
      <div className="flex-1" />
      <button
        onClick={() => setShowOnboarding(true)}
        className="text-gray-600 hover:text-gray-400 transition-colors p-1 rounded"
        title={t('status.help')}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  )
}
