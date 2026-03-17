/**
 * 聊天面板 — 显示对话消息 + 流式回复 + Markdown 渲染
 */
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useConversationStore, Message } from '../stores/conversationStore'
import { useT, getAgentName } from '../i18n'

export default function ChatPanel() {
  const messages = useConversationStore(s => s.messages)
  const isLoading = useConversationStore(s => s.isLoading)
  const streamingContent = useConversationStore(s => s.streamingContent)
  const streamingAgent = useConversationStore(s => s.streamingAgent)
  const progress = useConversationStore(s => s.progress)
  const error = useConversationStore(s => s.error)
  const currentConversation = useConversationStore(s => s.currentConversation)
  const t = useT()

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // Empty state
  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-600 max-w-sm">
          <div className="text-5xl mb-4 opacity-20">🏛️</div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">{t('chat.title')}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t('chat.empty_hint')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400/70">{t('chat.l1_badge')}</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400/70">{t('chat.l2_badge')}</span>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400/70">{t('chat.l3_badge')}</span>
            <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400/70">{t('chat.l4_badge')}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Progress bar */}
      {progress && (
        <div className="px-4 py-2 border-b border-white/5 glass-light">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">
              {progress.state_label}
              {progress.current_agent && (
                <span className="text-blue-400 ml-1.5">
                  {getAgentName(progress.current_agent)}
                </span>
              )}
            </span>
            <span className="text-gray-500 font-mono">{progress.progress_pct}%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progress.progress_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming reply */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs">🏛️</span>
            </div>
            <div className="flex-1 min-w-0">
              {streamingAgent && (
                <div className="text-[10px] text-gray-500 mb-1">
                  {getAgentName(streamingAgent)} {t('chat.thinking')}
                </div>
              )}
              <div className="glass-light rounded-2xl rounded-tl-md px-4 py-3 text-sm text-gray-300 leading-relaxed">
                {streamingContent ? (
                  <div className="whitespace-pre-wrap">{streamingContent}<span className="cursor-blink">▎</span></div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="dot-pulse" />
                    {t('chat.processing')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const [showDetails, setShowDetails] = useState(false)
  const isUser = message.role === 'user'
  const meta = message.metadata
  const t = useT()

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] glass-light rounded-2xl rounded-tr-md px-4 py-3
          bg-blue-500/10 border-blue-500/10">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs">🏛️</span>
      </div>
      <div className="flex-1 min-w-0 max-w-[90%]">
        {/* Level badge */}
        {meta?.level && (
          <div className="flex items-center gap-2 mb-1.5">
            <LevelBadge level={meta.level} label={meta.level_label} />
            {meta.total_transitions != null && meta.total_transitions > 0 && (
              <span className="text-[10px] text-gray-600">
                {meta.total_transitions} {t('chat.steps')}
              </span>
            )}
          </div>
        )}

        {/* Message content — Markdown rendered */}
        <div className="glass-light rounded-2xl rounded-tl-md px-4 py-3 text-sm text-gray-300 leading-relaxed">
          <MarkdownContent content={extractContent(message.content)} />
        </div>

        {/* Expandable details */}
        {(meta?.flow_log?.length || meta?.votes?.length) ? (
          <div className="mt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1"
            >
              <span className={`transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`}>▶</span>
              {t('chat.details')}
            </button>

            {showDetails && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {meta?.flow_log && meta.flow_log.length > 0 && (
                  <div className="glass-light rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">{t('chat.flow')}</div>
                    <div className="space-y-1.5">
                      {meta.flow_log.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="text-blue-400">{entry.from}</span>
                          <span className="text-gray-600">→</span>
                          <span className="text-emerald-400">{entry.to}</span>
                          {entry.reason && (
                            <span className="text-gray-600 truncate">({entry.reason})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meta?.votes && meta.votes.length > 0 && (
                  <div className="glass-light rounded-xl p-3">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2">{t('chat.votes')}</div>
                    <div className="space-y-1">
                      {meta.votes.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${v.vote === 'approve' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-gray-300">{getAgentName(v.agent)}</span>
                          <span className={v.vote === 'approve' ? 'text-emerald-400' : 'text-red-400'}>
                            {v.vote === 'approve' ? t('chat.approve') : t('chat.reject')}
                          </span>
                          {v.reason && <span className="text-gray-600 truncate">— {v.reason}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="text-[10px] text-gray-700 mt-1.5">
          {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  )
}

/** Markdown content renderer using react-markdown + remark-gfm */
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-gray-100 font-bold text-lg mt-3 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-gray-100 font-bold text-base mt-3 mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-gray-200 font-semibold text-sm mt-2 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-gray-200 font-semibold text-sm mt-2 mb-1">{children}</h4>,
          p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1.5 ml-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1.5 ml-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-gray-200 font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-gray-300 italic">{children}</em>,
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className="block bg-gray-900/60 border border-white/5 rounded-lg p-3 my-2 text-[13px] text-blue-300 font-mono overflow-x-auto whitespace-pre">
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-white/5 px-1.5 py-0.5 rounded text-[13px] text-blue-300 font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-blue-500/30 pl-3 my-2 text-gray-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-white/10 my-3" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-white/10">{children}</thead>,
          th: ({ children }) => <th className="px-2 py-1.5 text-left text-gray-300 font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-2 py-1.5 text-gray-400 border-t border-white/5">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function LevelBadge({ level, label }: { level: string; label?: string }) {
  const colors: Record<string, string> = {
    L1: 'bg-amber-500/15 text-amber-400',
    L2: 'bg-blue-500/15 text-blue-400',
    L3: 'bg-purple-500/15 text-purple-400',
    L4: 'bg-red-500/15 text-red-400',
  }
  const cls = colors[level] || colors.L2
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label || level}
    </span>
  )
}

/** Extract human-readable content from potential JSON text */
function extractContent(text: string): string {
  if (!text) return text
  try {
    let s = text.trim()
    s = s.replace(/^```\s*(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}') + 1
    if (start < 0 || end <= start) return text
    const data = JSON.parse(s.slice(start, end))
    if (typeof data !== 'object' || data === null) return text

    const parts: string[] = []
    for (const key of ['direct_response', 'response', 'answer', 'execution_plan',
      'final_bill', 'final_response', 'summary', 'conclusion', 'majority_opinion']) {
      if (data[key] && typeof data[key] === 'string' && data[key].length > 5) parts.push(data[key])
    }
    if (Array.isArray(data.deliverables)) {
      for (const d of data.deliverables) {
        if (d?.content && typeof d.content === 'string' && d.content.length > 5) parts.push(d.content)
      }
    }
    for (const key of ['result', 'output', 'content', 'assessment']) {
      if (data[key] && typeof data[key] === 'string' && data[key].length > 5) parts.push(data[key])
    }
    if (parts.length === 0 && data.reasoning) parts.push(data.reasoning)

    if (parts.length > 0) {
      return [...new Set(parts)].join('\n\n')
    }
  } catch { /* not JSON */ }
  return text
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
