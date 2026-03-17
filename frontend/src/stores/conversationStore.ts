/**
 * 会话状态管理 — 多轮对话核心
 */
import { create } from 'zustand'

const API_BASE = '/api'

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  last_message?: string
  message_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  task_id?: string
  metadata?: {
    level?: string
    level_label?: string
    state?: string
    total_transitions?: number
    flow_log?: Array<{ timestamp: string; from: string; to: string; reason?: string }>
    votes?: Array<{ agent: string; vote: string; reason: string }>
  }
  created_at: string
}

interface ConversationStore {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  streamingContent: string
  streamingAgent: string
  error: string | null

  // 进度
  progress: {
    state: string
    state_label: string
    progress_pct: number
    current_agent: string
    level: string
  } | null

  // Actions
  loadConversations: () => Promise<void>
  createConversation: () => Promise<Conversation | null>
  selectConversation: (id: string) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  sendMessage: (text: string, level?: string) => Promise<void>

  // 流式更新 (由 useAgentEvents 调用)
  appendStreaming: (chunk: string, agent?: string) => void
  clearStreaming: () => void
  finalizeMessage: (msg: Message) => void
  setProgress: (p: ConversationStore['progress']) => void
  setError: (err: string | null) => void
  addUserMessage: (msg: Message) => void
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  streamingContent: '',
  streamingAgent: '',
  error: null,
  progress: null,

  loadConversations: async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      set({ conversations: data })
    } catch (e) {
      console.error('加载会话列表失败:', e)
    }
  },

  createConversation: async () => {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const conv: Conversation = await res.json()
      set(s => ({
        conversations: [conv, ...s.conversations],
        currentConversation: conv,
        messages: [],
        streamingContent: '',
        progress: null,
        error: null,
      }))
      return conv
    } catch (e) {
      console.error('创建会话失败:', e)
      set({ error: '创建会话失败' })
      return null
    }
  },

  selectConversation: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      set({
        currentConversation: data,
        messages: data.messages || [],
        streamingContent: '',
        progress: null,
        error: null,
      })
    } catch (e) {
      console.error('加载会话失败:', e)
      set({ error: '加载会话失败' })
    }
  },

  deleteConversation: async (id: string) => {
    try {
      await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' })
      set(s => ({
        conversations: s.conversations.filter(c => c.id !== id),
        currentConversation: s.currentConversation?.id === id ? null : s.currentConversation,
        messages: s.currentConversation?.id === id ? [] : s.messages,
      }))
    } catch (e) {
      console.error('删除会话失败:', e)
    }
  },

  sendMessage: async (text: string, level: string = 'auto') => {
    const { currentConversation } = get()
    let conv = currentConversation

    // 自动创建会话
    if (!conv) {
      conv = await get().createConversation()
      if (!conv) return
    }

    set({ isLoading: true, error: null, streamingContent: '', progress: null })

    // 立即添加用户消息到UI
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: conv.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, tempUserMsg] }))

    try {
      const res = await fetch(`${API_BASE}/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, level }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // 替换临时消息为服务端返回的真实消息
      if (data.user_message) {
        set(s => ({
          messages: s.messages.map(m =>
            m.id === tempUserMsg.id ? data.user_message : m
          ),
        }))
      }

      // 更新会话列表中的标题
      set(s => ({
        conversations: s.conversations.map(c =>
          c.id === conv!.id ? { ...c, title: text.slice(0, 50), last_message: text.slice(0, 100) } : c
        ),
      }))

      // isLoading 保持 true，等待 message.created 事件来关闭
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '发送失败'
      set({ isLoading: false, error: msg })
    }
  },

  appendStreaming: (chunk: string, agent?: string) => set(s => ({
    streamingContent: s.streamingContent + chunk,
    streamingAgent: agent || s.streamingAgent,
  })),

  clearStreaming: () => set({ streamingContent: '', streamingAgent: '' }),

  finalizeMessage: (msg: Message) => set(s => ({
    messages: [...s.messages, msg],
    isLoading: false,
    streamingContent: '',
    streamingAgent: '',
    progress: null,
  })),

  setProgress: (p) => set({ progress: p }),

  setError: (err) => set({ error: err, isLoading: false }),

  addUserMessage: (msg: Message) => set(s => ({
    messages: [...s.messages, msg],
  })),
}))
