/**
 * 任务结果输出面板 — 时间线视图 + 毛玻璃卡片
 */
import { useState } from 'react'
import { useTaskStore } from '../stores/taskStore'
import { useT } from '../i18n'

export default function ResultOutput() {
  const task = useTaskStore(s => s.currentTask)
  const [billExpanded, setBillExpanded] = useState(false)
  const t = useT()

  if (!task) return null

  const isComplete = ['enacted', 'completed', 'unconstitutional', 'tabled'].includes(task.state)

  return (
    <div className="border-t border-white/5">
      {/* Flow trace timeline */}
      {task.flow_log && task.flow_log.length > 0 && (
        <div className="p-3">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">{t('result.flow_trace')}</div>
          <div className="relative max-h-36 overflow-y-auto pl-4">
            <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/10" />
            <div className="space-y-2">
              {task.flow_log.map((entry, i) => (
                <div key={i} className="relative flex items-start gap-2 text-xs animate-fade-in">
                  <div className="absolute -left-[10.5px] top-1.5 w-2 h-2 rounded-full bg-blue-400/60 border border-blue-400/30" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-400 font-medium">{entry.from}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-emerald-400 font-medium">{entry.to}</span>
                    </div>
                    {entry.reason && (
                      <p className="text-gray-500 text-[10px] mt-0.5 truncate">{entry.reason}</p>
                    )}
                  </div>
                  <span className="text-gray-700 text-[9px] font-mono shrink-0">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Final result */}
      {isComplete && task.output && (
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <ResultIcon state={task.state} />
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {task.state === 'enacted' ? t('result.final') :
               task.state === 'unconstitutional' ? t('result.unconstitutional') : t('result.tabled')}
            </span>
          </div>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap
                        glass-light rounded-xl p-3 max-h-48 overflow-y-auto">
            {extractContent(task.output)}
          </div>
        </div>
      )}

      {/* Bill content */}
      {task.bill_content && (
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setBillExpanded(!billExpanded)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {t('result.bill_draft')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600">v{task.bill_version || 1}</span>
              <span className={`text-gray-600 text-xs transition-transform duration-200
                ${billExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>
          {billExpanded && (
            <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap
                          glass-light rounded-lg p-2.5 max-h-32 overflow-y-auto font-mono animate-fade-in">
              {task.bill_content}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function extractContent(text: string): string {
  if (!text) return text
  try {
    let s = text.trim()
    s = s.replace(/^```\s*(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}') + 1
    if (start >= 0 && end > start) {
      const data = JSON.parse(s.slice(start, end))
      for (const key of ['direct_response', 'response', 'answer', 'execution_plan',
        'final_bill', 'summary', 'conclusion', 'majority_opinion']) {
        if (data[key] && typeof data[key] === 'string' && data[key].length > 5) return data[key]
      }
      if (Array.isArray(data.deliverables)) {
        const contents = data.deliverables
          .map((d: Record<string, unknown>) => d.content)
          .filter((c: unknown) => typeof c === 'string' && (c as string).length > 5)
        if (contents.length > 0) return contents.join('\n\n')
      }
      for (const key of ['result', 'output', 'content', 'assessment']) {
        if (data[key] && typeof data[key] === 'string' && data[key].length > 5) return data[key]
      }
      if (data.reasoning) return data.reasoning
    }
  } catch { /* not JSON, return as-is */ }
  return text
}

function ResultIcon({ state }: { state: string }) {
  const classes = {
    enacted: 'bg-emerald-500/15 text-emerald-400',
    unconstitutional: 'bg-red-500/15 text-red-400',
    tabled: 'bg-gray-500/15 text-gray-400',
  }
  const icons = { enacted: '✓', unconstitutional: '✗', tabled: '—' }
  const cls = classes[state as keyof typeof classes] || classes.tabled
  const icon = icons[state as keyof typeof icons] || '—'

  return (
    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${cls}`}>
      {icon}
    </span>
  )
}

function formatTime(ts: string): string {
  try {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
  } catch {
    return ts
  }
}
