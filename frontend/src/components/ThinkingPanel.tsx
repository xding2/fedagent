/**
 * 思考面板 — Agent 实时状态监控，毛玻璃卡片风格
 */
import { useAgentStore, AGENT_BUILDING } from '../stores/agentStore'
import { useT, getAgentName } from '../i18n'

const BRANCH_STYLES: Record<string, { border: string; dot: string }> = {
  executive: { border: 'border-l-blue-500', dot: 'bg-blue-500' },
  legislative: { border: 'border-l-amber-500', dot: 'bg-amber-500' },
  judicial: { border: 'border-l-red-500', dot: 'bg-red-500' },
}

const STATE_DOTS: Record<string, string> = {
  thinking: 'bg-yellow-400 animate-dot-pulse',
  working: 'bg-blue-400 animate-dot-pulse',
  talking: 'bg-purple-400',
  celebrating: 'bg-emerald-400',
  rejecting: 'bg-red-400',
}

function getBranch(agentId: string): string {
  const building = AGENT_BUILDING[agentId]
  if (!building) return 'executive'
  if (building.includes('capitol')) return 'legislative'
  if (building.includes('supreme')) return 'judicial'
  return 'executive'
}

export default function ThinkingPanel() {
  const agents = useAgentStore(s => s.agents)
  const t = useT()

  const activeAgents = Object.values(agents)
    .filter(a => a.state !== 'idle')
    .sort((a, b) => {
      const priority: Record<string, number> = { thinking: 0, working: 1, talking: 2, celebrating: 3, rejecting: 4 }
      return (priority[a.state] ?? 5) - (priority[b.state] ?? 5)
    })

  const idleAgents = Object.values(agents).filter(a => a.state === 'idle')

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {t('thinking.title')}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {activeAgents.map(agent => {
          const branch = getBranch(agent.id)
          const style = BRANCH_STYLES[branch] || BRANCH_STYLES.executive
          const dotClass = STATE_DOTS[agent.state] || 'bg-gray-400'

          return (
            <div
              key={agent.id}
              className={`glass-light rounded-xl p-3 border-l-2 ${style.border} animate-fade-in
                ${agent.state === 'thinking' ? 'animate-glow' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                <span className="text-sm font-medium text-gray-200">
                  {getAgentName(agent.id)}
                </span>
                <span className="text-[10px] text-gray-600 font-mono">
                  {agent.id}
                </span>
              </div>

              {agent.thinkingText && (
                <div className="text-xs text-gray-400 mt-1 max-h-20 overflow-y-auto
                              font-mono leading-relaxed gradient-mask-b">
                  {agent.thinkingText.slice(-300)}
                  <span className="cursor-blink" />
                </div>
              )}
            </div>
          )
        })}

        {activeAgents.length === 0 && (
          <div className="text-center text-gray-600 py-10 text-sm">
            <div className="text-3xl mb-2 opacity-20">🌙</div>
            {t('thinking.all_idle')}
          </div>
        )}

        {idleAgents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">{t('thinking.idle_section')}</div>
            <div className="flex flex-wrap gap-1.5">
              {idleAgents.map(a => {
                const branch = getBranch(a.id)
                const dotColor = BRANCH_STYLES[branch]?.dot || 'bg-gray-500'
                return (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px]
                               bg-white/3 text-gray-500 rounded-md border border-white/5"
                    title={a.id}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} opacity-40`} />
                    {getAgentName(a.id)}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
