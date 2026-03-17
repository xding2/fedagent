/**
 * 会话列表侧栏 — 多轮对话管理
 */
import { useEffect } from 'react'
import { useConversationStore, Conversation } from '../stores/conversationStore'
import { useT } from '../i18n'

export default function ConversationSidebar() {
  const conversations = useConversationStore(s => s.conversations)
  const currentConversation = useConversationStore(s => s.currentConversation)
  const loadConversations = useConversationStore(s => s.loadConversations)
  const createConversation = useConversationStore(s => s.createConversation)
  const selectConversation = useConversationStore(s => s.selectConversation)
  const deleteConversation = useConversationStore(s => s.deleteConversation)
  const t = useT()

  useEffect(() => { loadConversations() }, [loadConversations])

  return (
    <div className="h-full flex flex-col glass border-r border-white/5">
      {/* Top: new conversation */}
      <div className="p-3 border-b border-white/5">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
            bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-sm font-medium
            transition-all duration-200 border border-blue-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('sidebar.new_chat')}
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-600 py-12 text-sm">
            <div className="text-3xl mb-3 opacity-20">💬</div>
            <p>{t('sidebar.no_conversations')}</p>
            <p className="text-xs text-gray-700 mt-1">{t('sidebar.click_to_start')}</p>
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={currentConversation?.id === conv.id}
              onSelect={() => selectConversation(conv.id)}
              onDelete={() => deleteConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const t = useT()

  return (
    <button
      onClick={onSelect}
      className={`group w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 relative
        ${isActive
          ? 'glass-light border border-blue-500/30 shadow-lg shadow-blue-500/5'
          : 'hover:bg-white/5 border border-transparent'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-200 truncate font-medium text-[13px] flex-1 mr-2">
          {conversation.title || t('sidebar.new_conversation')}
        </span>

        <span
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600
            hover:text-red-400 cursor-pointer shrink-0 p-0.5"
          title={t('sidebar.delete')}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      </div>

      {conversation.last_message && (
        <p className="text-xs text-gray-500 mt-1 truncate">
          {conversation.last_message}
        </p>
      )}

      <div className="text-[10px] text-gray-700 mt-1">
        {formatRelativeTime(conversation.updated_at, t)}
      </div>
    </button>
  )
}

function formatRelativeTime(dateStr: string, t: (key: string) => string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('sidebar.just_now')
    if (minutes < 60) return `${minutes} ${t('sidebar.minutes_ago')}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ${t('sidebar.hours_ago')}`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} ${t('sidebar.days_ago')}`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}
