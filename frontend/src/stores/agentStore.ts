/**
 * Agent 状态管理 — 驱动像素动画
 */
import { create } from 'zustand'

export type AgentState = 'idle' | 'thinking' | 'working' | 'talking' | 'celebrating' | 'rejecting'

export interface AgentStatus {
  id: string
  name: string
  branch: string     // executive / legislative / judicial
  state: AgentState
  thinkingText: string    // 当前思考内容 (流式)
  lastResult: string      // 最后一次输出
}

// Agent 中文名映射
export const AGENT_NAMES: Record<string, string> = {
  president: '总统',
  chief_of_staff: '幕僚长',
  sec_strategy: '战略部长',
  sec_research: '研究部长',
  sec_operations: '执行部长',
  sec_quality: '质量部长',
  attorney_general: '总检察长',
  speaker_house: '众议院议长',
  senate_leader: '参议院领袖',
  house_committee: '众院委员会',
  senate_committee: '参院委员会',
  cbo: '预算办公室',
  chief_justice: '首席大法官',
  justice_progressive: '进步派大法官',
  justice_originalist: '保守派大法官',
  press_secretary: '新闻秘书',
}

// Agent 所属建筑
export const AGENT_BUILDING: Record<string, string> = {
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

interface AgentStore {
  agents: Record<string, AgentStatus>
  activeBuildings: Set<string>  // 当前激活的建筑
  flyingDocuments: FlyingDoc[]

  initAgents: () => void
  setAgentState: (id: string, state: AgentState) => void
  appendThinking: (id: string, chunk: string) => void
  clearThinking: (id: string) => void
  setActiveBuilding: (building: string, active: boolean) => void
  addFlyingDoc: (doc: FlyingDoc) => void
  removeFlyingDoc: (id: string) => void
}

export interface FlyingDoc {
  id: string
  type: 'envelope' | 'document' | 'amendment' | 'ruling' | 'reject'
  fromBuilding: string
  toBuilding: string
  progress: number  // 0-1
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {},
  activeBuildings: new Set(),
  flyingDocuments: [],

  initAgents: () => {
    const agents: Record<string, AgentStatus> = {}
    for (const [id, name] of Object.entries(AGENT_NAMES)) {
      agents[id] = {
        id,
        name,
        branch: AGENT_BUILDING[id]?.includes('capitol') ? 'legislative'
          : AGENT_BUILDING[id]?.includes('supreme') ? 'judicial'
          : 'executive',
        state: 'idle',
        thinkingText: '',
        lastResult: '',
      }
    }
    set({ agents })
  },

  setAgentState: (id, state) => set((s) => ({
    agents: { ...s.agents, [id]: { ...s.agents[id], state } },
  })),

  appendThinking: (id, chunk) => set((s) => ({
    agents: {
      ...s.agents,
      [id]: {
        ...s.agents[id],
        state: 'thinking',
        thinkingText: (s.agents[id]?.thinkingText || '') + chunk,
      },
    },
  })),

  clearThinking: (id) => set((s) => ({
    agents: {
      ...s.agents,
      [id]: { ...s.agents[id], thinkingText: '', state: 'idle' },
    },
  })),

  setActiveBuilding: (building, active) => set((s) => {
    const newSet = new Set(s.activeBuildings)
    if (active) newSet.add(building)
    else newSet.delete(building)
    return { activeBuildings: newSet }
  }),

  addFlyingDoc: (doc) => set((s) => ({
    flyingDocuments: [...s.flyingDocuments, doc],
  })),

  removeFlyingDoc: (id) => set((s) => ({
    flyingDocuments: s.flyingDocuments.filter(d => d.id !== id),
  })),
}))
