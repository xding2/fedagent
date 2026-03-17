/**
 * Agent 事件处理 — 将 WebSocket 消息映射到 Zustand Store
 */
import { useEffect } from 'react'
import { useAgentStore } from '../stores/agentStore'
import { useTaskStore, Task } from '../stores/taskStore'
import { useConversationStore } from '../stores/conversationStore'
import { WSMessage } from './useWebSocket'

export function useAgentEvents(
  subscribe: (handler: (msg: WSMessage) => void) => () => void
) {
  const setAgentState = useAgentStore(s => s.setAgentState)
  const appendThinking = useAgentStore(s => s.appendThinking)
  const clearThinking = useAgentStore(s => s.clearThinking)
  const setActiveBuilding = useAgentStore(s => s.setActiveBuilding)
  const addFlyingDoc = useAgentStore(s => s.addFlyingDoc)
  const removeFlyingDoc = useAgentStore(s => s.removeFlyingDoc)

  const updateTask = useTaskStore(s => s.updateTask)
  const addTask = useTaskStore(s => s.addTask)
  const setCurrentTask = useTaskStore(s => s.setCurrentTask)

  // conversation store actions (accessed via getState to avoid dependency issues)
  const convStore = useConversationStore

  useEffect(() => {
    const unsub = subscribe((msg) => {
      const { type, task_id, data } = msg
      const agent = msg.agent || msg.agent_id || ''

      switch (type) {
        // ---- Agent 思考开始 ----
        case 'agent.thinking.start':
          if (agent) {
            setAgentState(agent, 'thinking')
            clearThinking(agent)
            const building = getBuildingForAgent(agent)
            if (building) setActiveBuilding(building, true)
          }
          break

        // ---- Agent 思考流式 chunk ----
        case 'agent.thinking.chunk':
          if (agent && data?.chunk) {
            appendThinking(agent, data.chunk)
            // 同步到聊天面板的流式显示
            convStore.getState().appendStreaming(data.chunk, agent)
          }
          break

        // ---- Agent 思考结束 ----
        case 'agent.thinking.end':
        case 'agent.thinking.done':
          if (agent) {
            setAgentState(agent, 'working')
            const building = getBuildingForAgent(agent)
            if (building) setActiveBuilding(building, false)
          }
          break

        // ---- Agent 结果 ----
        case 'agent.result':
          if (agent) {
            setAgentState(agent, 'idle')
            clearThinking(agent)
            const building = getBuildingForAgent(agent)
            if (building) setActiveBuilding(building, false)
          }
          break

        // ---- 任务创建 ----
        case 'task.created':
          if (task_id && data) {
            const newTask: Task = {
              id: task_id,
              title: data.title || '',
              state: 'intake',
              state_label: data.level_description || 'Intake',
              level: data.level || 'L2',
              current_agent: '',
              output: '',
              bill_content: '',
              bill_version: 0,
              flow_log: [],
              progress_log: [],
              votes: [],
              opinions: [],
              draft_rounds: 0,
              chamber_rounds: 0,
              total_transitions: 0,
              created_at: null,
              updated_at: null,
            }
            addTask(newTask)
            // 清除之前的流式内容
            convStore.getState().clearStreaming()
          }
          break

        // ---- 任务路由 ----
        case 'task.routed':
          if (task_id && agent) {
            updateTask({ id: task_id, current_agent: agent, state: data?.state || 'intake' })
          }
          break

        // ---- 任务状态变化 ----
        case 'task.state_changed':
          if (task_id && data) {
            updateTask({ id: task_id, ...data })
          }
          break

        // ---- 任务进度 ----
        case 'task.progress':
          if (data) {
            convStore.getState().setProgress({
              state: data.state || '',
              state_label: data.state_label || '',
              progress_pct: data.progress_pct || 0,
              current_agent: data.current_agent || '',
              level: data.level || '',
            })
          }
          break

        // ---- 任务完成 ----
        case 'task.completed':
          if (task_id) {
            updateTask({
              id: task_id,
              state: 'completed',
              state_label: 'Completed',
              output: data?.output || '',
            })
            // 重置所有 agent 为 idle
            Object.keys(getBuildingMap()).forEach(agentId => {
              setAgentState(agentId, 'idle')
              clearThinking(agentId)
            })
            // 重置建筑
            ;['white_house', 'capitol', 'supreme_court', 'press_podium'].forEach(b =>
              setActiveBuilding(b, false)
            )
            // 清除进度和流式内容
            convStore.getState().setProgress(null)
            convStore.getState().clearStreaming()
          }
          break

        // ---- 新消息 (assistant 回复) ----
        case 'message.created':
          if (data?.message) {
            const { message: msgData } = data
            // 确认是当前会话的消息
            const currentConv = convStore.getState().currentConversation
            if (currentConv && data.conversation_id === currentConv.id) {
              convStore.getState().finalizeMessage(msgData)
            }
            // 刷新会话列表
            convStore.getState().loadConversations()
          }
          break

        // ---- 投票 ----
        case 'vote.result':
        case 'vote.cast':
          if (agent) {
            const voteResult = data?.result || data?.vote || ''
            setAgentState(agent, voteResult === 'approve' ? 'celebrating' : 'rejecting')
            setTimeout(() => setAgentState(agent, 'idle'), 2000)
          }
          break

        // ---- 文件传递 ----
        case 'document.transfer':
          if (data?.from && data?.to) {
            const docId = `doc_${Date.now()}`
            addFlyingDoc({
              id: docId,
              type: data.doc_type || 'document',
              fromBuilding: data.from,
              toBuilding: data.to,
              progress: 0,
            })
            setTimeout(() => removeFlyingDoc(docId), 1500)
          }
          break

        // ---- 总统签署/否决 ----
        case 'bill.signed':
          setAgentState('president', 'celebrating')
          setTimeout(() => setAgentState('president', 'idle'), 3000)
          break

        case 'bill.vetoed':
          setAgentState('president', 'rejecting')
          setTimeout(() => setAgentState('president', 'idle'), 3000)
          break

        // ---- 否决推翻 ----
        case 'veto.overridden':
          setAgentState('speaker_house', 'celebrating')
          setTimeout(() => setAgentState('speaker_house', 'idle'), 3000)
          break

        // ---- 司法裁决 ----
        case 'judicial.ruling':
          setAgentState('chief_justice', 'talking')
          setTimeout(() => setAgentState('chief_justice', 'idle'), 3000)
          break

        // ---- 用户命令确认 ----
        case 'user.fast':
        case 'user.skip':
        case 'user.stop':
          break
      }
    })

    return unsub
  }, [subscribe, setAgentState, appendThinking, clearThinking,
      setActiveBuilding, addFlyingDoc, removeFlyingDoc,
      updateTask, addTask, setCurrentTask])
}

// Agent → 建筑映射
const BUILDING_MAP: Record<string, string> = {
  president: 'white_house',
  chief_of_staff: 'white_house',
  sec_strategy: 'white_house',
  sec_research: 'white_house',
  sec_operations: 'white_house',
  sec_quality: 'white_house',
  attorney_general: 'white_house',
  speaker_house: 'capitol',
  senate_leader: 'capitol',
  house_committee: 'capitol',
  senate_committee: 'capitol',
  cbo: 'capitol',
  chief_justice: 'supreme_court',
  justice_progressive: 'supreme_court',
  justice_originalist: 'supreme_court',
  press_secretary: 'press_podium',
}

function getBuildingMap() { return BUILDING_MAP }
function getBuildingForAgent(agentId: string): string | undefined {
  return BUILDING_MAP[agentId]
}
