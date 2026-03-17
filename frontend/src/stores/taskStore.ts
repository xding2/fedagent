/**
 * 任务状态管理
 */
import { create } from 'zustand'

export interface FlowEntry {
  timestamp: string
  from: string
  to: string
  agent: string
  reason: string
}

export interface Vote {
  agent: string
  vote: string
  reason: string
}

export interface Task {
  id: string
  title: string
  state: string
  state_label: string
  level: string
  current_agent: string
  output: string
  bill_content: string
  bill_version: number
  flow_log: FlowEntry[]
  progress_log: { timestamp: string; agent: string; message: string }[]
  votes: Vote[]
  opinions: { agent: string; opinion: string; stance: string }[]
  draft_rounds: number
  chamber_rounds: number
  total_transitions: number
  created_at: string | null
  updated_at: string | null
}

interface TaskStore {
  currentTask: Task | null
  tasks: Task[]
  setCurrentTask: (task: Task | null) => void
  updateTask: (task: Partial<Task> & { id: string }) => void
  addTask: (task: Task) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  currentTask: null,
  tasks: [],
  setCurrentTask: (task) => set({ currentTask: task }),
  updateTask: (partial) => set((state) => {
    const tasks = state.tasks.map(t =>
      t.id === partial.id ? { ...t, ...partial } : t
    )
    const currentTask = state.currentTask?.id === partial.id
      ? { ...state.currentTask, ...partial }
      : state.currentTask
    return { tasks, currentTask }
  }),
  addTask: (task) => set((state) => ({
    tasks: [task, ...state.tasks],
    currentTask: task,
  })),
}))
