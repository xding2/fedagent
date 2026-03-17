/**
 * FedAgent — 三权分立多 Agent 协作系统
 * 三栏布局: 左侧会话列表 + 中间(像素世界+聊天) + 右侧Agent监控
 */
import { useEffect, useCallback } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { useAgentEvents } from './hooks/useAgentEvents'
import { useAgentStore } from './stores/agentStore'
import { useTaskStore } from './stores/taskStore'
import { useConversationStore } from './stores/conversationStore'
import { useUIStore } from './stores/uiStore'
import { useT } from './i18n'

import PixiCanvas from './components/PixiCanvas'
import ChatInput from './components/ChatInput'
import ChatPanel from './components/ChatPanel'
import ConversationSidebar from './components/ConversationSidebar'
import StatusBar from './components/StatusBar'
import ThinkingPanel from './components/ThinkingPanel'
import VoteBoard from './components/VoteBoard'
import ResultOutput from './components/ResultOutput'
import ToastContainer from './components/Toast'
import OnboardingModal from './components/OnboardingModal'

export default function App() {
  const { connected, subscribe } = useWebSocket()
  const initAgents = useAgentStore(s => s.initAgents)
  const currentTask = useTaskStore(s => s.currentTask)

  const sendMessage = useConversationStore(s => s.sendMessage)
  const isLoading = useConversationStore(s => s.isLoading)

  const showSidebar = useUIStore(s => s.showSidebar)
  const showAgentPanel = useUIStore(s => s.showAgentPanel)
  const toggleSidebar = useUIStore(s => s.toggleSidebar)
  const toggleAgentPanel = useUIStore(s => s.toggleAgentPanel)
  const selectedLevel = useUIStore(s => s.selectedLevel)
  const showOnboarding = useUIStore(s => s.showOnboarding)
  const locale = useUIStore(s => s.locale)
  const setLocale = useUIStore(s => s.setLocale)

  const t = useT()

  useEffect(() => { initAgents() }, [initAgents])
  useAgentEvents(subscribe)

  // Ctrl+N: new conversation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        useConversationStore.getState().createConversation()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = useCallback(async (text: string) => {
    await sendMessage(text, selectedLevel)
  }, [sendMessage, selectedLevel])

  const handleCommand = useCallback(async (cmd: string) => {
    if (!currentTask) return
    try {
      await fetch(`/api/tasks/${currentTask.id}/${cmd}`, { method: 'POST' })
    } catch (e) {
      console.error('Command failed:', e)
    }
  }, [currentTask])

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: conversation list */}
        {showSidebar && (
          <div className="w-[260px] min-w-[200px] shrink-0">
            <ConversationSidebar />
          </div>
        )}

        {/* Center: pixel world + chat */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Toolbar */}
          <div className="h-10 flex items-center justify-between px-3 border-b border-white/5 glass shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                title={showSidebar ? t('app.collapse_sidebar') : t('app.expand_sidebar')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 font-medium">FedAgent</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium
                  hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors
                  border border-white/5"
                title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
              >
                {locale === 'zh' ? 'EN' : '中文'}
              </button>
              <button
                onClick={toggleAgentPanel}
                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                title={showAgentPanel ? t('app.collapse_panel') : t('app.expand_panel')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Pixel world */}
          <div className="h-[40%] min-h-[200px] relative border-b border-white/5">
            <PixiCanvas />
          </div>

          {/* Chat area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatPanel />
            <div className="p-3 border-t border-white/5">
              <ChatInput
                onSubmit={handleSubmit}
                onCommand={handleCommand}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Right: Agent monitor panel */}
        {showAgentPanel && (
          <div className="w-[320px] min-w-[280px] max-w-[380px] shrink-0 flex flex-col glass border-l border-white/5">
            <div className="h-10 flex items-center px-3 border-b border-white/5 shrink-0">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('app.agent_monitor')}</span>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <ThinkingPanel />
              </div>
              <VoteBoard />
              <ResultOutput />
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <StatusBar connected={connected} />

      {/* Toast */}
      <ToastContainer />

      {/* Onboarding */}
      {showOnboarding && <OnboardingModal />}
    </div>
  )
}
