/**
 * 投票面板 — 投票记录与司法意见，着色毛玻璃卡片
 */
import { useTaskStore } from '../stores/taskStore'
import { useT, getAgentName } from '../i18n'

export default function VoteBoard() {
  const task = useTaskStore(s => s.currentTask)
  const t = useT()

  if (!task) return null

  const hasVotes = task.votes && task.votes.length > 0
  const hasOpinions = task.opinions && task.opinions.length > 0

  if (!hasVotes && !hasOpinions) return null

  const approveCount = task.votes?.filter(v => v.vote === 'approve').length || 0
  const rejectCount = task.votes?.filter(v => v.vote === 'reject').length || 0
  const totalVotes = approveCount + rejectCount

  return (
    <div className="border-t border-white/5">
      {hasVotes && (
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{t('vote.title')}</span>
            {totalVotes > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-emerald-400">{approveCount}</span>
                <div className="w-16 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${totalVotes > 0 ? (approveCount / totalVotes) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-red-400">{rejectCount}</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            {task.votes.map((v, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs p-2 rounded-lg animate-fade-in
                  ${v.vote === 'approve'
                    ? 'bg-emerald-500/8 border border-emerald-500/15'
                    : v.vote === 'reject'
                    ? 'bg-red-500/8 border border-red-500/15'
                    : 'bg-amber-500/8 border border-amber-500/15'
                  }`}
              >
                <span className={`mt-0.5 text-sm shrink-0 ${
                  v.vote === 'approve' ? 'text-emerald-400' :
                  v.vote === 'reject' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {v.vote === 'approve' ? '✓' : v.vote === 'reject' ? '✗' : '◆'}
                </span>
                <div className="min-w-0">
                  <span className="text-gray-300 font-medium">
                    {getAgentName(v.agent)}
                  </span>
                  {v.reason && (
                    <p className="text-gray-500 mt-0.5 leading-snug text-[11px]">{v.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasOpinions && (
        <div className="p-3 border-t border-white/5">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">{t('vote.judicial_opinions')}</div>
          <div className="space-y-1.5">
            {task.opinions.map((o, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs p-2 rounded-lg animate-fade-in
                  ${o.stance === 'constitutional'
                    ? 'bg-purple-500/8 border border-purple-500/15'
                    : 'bg-red-500/8 border border-red-500/15'
                  }`}
              >
                <span className="mt-0.5 text-sm shrink-0 text-purple-400">⚖</span>
                <div className="min-w-0">
                  <span className="text-gray-300 font-medium">
                    {getAgentName(o.agent)}
                  </span>
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    o.stance === 'constitutional'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  }`}>
                    {o.stance === 'constitutional' ? t('vote.constitutional') : t('vote.unconstitutional')}
                  </span>
                  <p className="text-gray-500 mt-1 leading-snug text-[11px]">{o.opinion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
