/**
 * 轻量级 i18n — 中英双语翻译
 */
import { useUIStore } from './stores/uiStore'

export type Locale = 'zh' | 'en'

const translations: Record<string, Record<Locale, string>> = {
  // ── App / Toolbar ──
  'app.name': { zh: 'FedAgent', en: 'FedAgent' },
  'app.collapse_sidebar': { zh: '收起会话列表', en: 'Collapse sidebar' },
  'app.expand_sidebar': { zh: '展开会话列表', en: 'Expand sidebar' },
  'app.collapse_panel': { zh: '收起监控面板', en: 'Collapse panel' },
  'app.expand_panel': { zh: '展开监控面板', en: 'Expand panel' },
  'app.agent_monitor': { zh: 'Agent 监控', en: 'Agent Monitor' },

  // ── Conversation Sidebar ──
  'sidebar.new_chat': { zh: '新对话', en: 'New Chat' },
  'sidebar.no_conversations': { zh: '还没有对话', en: 'No conversations yet' },
  'sidebar.click_to_start': { zh: '点击上方按钮开始', en: 'Click above to start' },
  'sidebar.delete': { zh: '删除对话', en: 'Delete conversation' },
  'sidebar.new_conversation': { zh: '新对话', en: 'New Chat' },
  'sidebar.just_now': { zh: '刚刚', en: 'Just now' },
  'sidebar.minutes_ago': { zh: '分钟前', en: 'min ago' },
  'sidebar.hours_ago': { zh: '小时前', en: 'hr ago' },
  'sidebar.days_ago': { zh: '天前', en: 'd ago' },

  // ── Chat Panel ──
  'chat.title': { zh: 'FedAgent 三权分立 AI', en: 'FedAgent — Separation of Powers AI' },
  'chat.empty_hint': {
    zh: '发送一条消息开始对话。你的问题将经过行政、立法、司法三大分支的协作处理。',
    en: 'Send a message to start. Your question will be processed through the Executive, Legislative, and Judicial branches.',
  },
  'chat.l1_badge': { zh: 'L1 快速回复', en: 'L1 Quick Reply' },
  'chat.l2_badge': { zh: 'L2 行政审批', en: 'L2 Executive' },
  'chat.l3_badge': { zh: 'L3 立法审议', en: 'L3 Legislative' },
  'chat.l4_badge': { zh: 'L4 全面审查', en: 'L4 Full Review' },
  'chat.thinking': { zh: '正在思考...', en: 'Thinking...' },
  'chat.processing': { zh: '正在处理你的请求...', en: 'Processing your request...' },
  'chat.details': { zh: '处理详情', en: 'Processing Details' },
  'chat.flow': { zh: '处理流程', en: 'Processing Flow' },
  'chat.votes': { zh: '投票记录', en: 'Vote Records' },
  'chat.approve': { zh: '通过', en: 'Approve' },
  'chat.reject': { zh: '否决', en: 'Reject' },
  'chat.steps': { zh: '步处理', en: 'steps' },

  // ── Chat Input ──
  'input.placeholder': { zh: '输入你的问题，按 Enter 发送...', en: 'Type your question, press Enter to send...' },
  'input.send': { zh: '发送', en: 'Send' },
  'input.actions': { zh: '操作:', en: 'Actions:' },
  'input.fast_track': { zh: '快速通道', en: 'Fast Track' },
  'input.fast_track_tip': { zh: '降级为 L2，跳过立法环节，直接由总统处理', en: 'Downgrade to L2, skip legislative process' },
  'input.skip': { zh: '跳过当前', en: 'Skip' },
  'input.skip_tip': { zh: '跳过当前审议阶段，进入下一个环节', en: 'Skip current stage, move to next' },
  'input.stop': { zh: '终止任务', en: 'Stop' },
  'input.stop_tip': { zh: '立即终止当前任务', en: 'Terminate current task immediately' },
  'input.confirm_stop': { zh: '确认终止？', en: 'Confirm?' },

  // ── Level Selector ──
  'level.title': { zh: '选择任务处理级别', en: 'Select processing level' },
  'level.auto': { zh: '自动', en: 'Auto' },
  'level.auto_desc': { zh: 'AI 自动判断复杂度', en: 'AI auto-determines complexity' },
  'level.l1_desc': { zh: '快速回复 — 直接由幕僚长回答', en: 'Quick Reply — Chief of Staff answers directly' },
  'level.l2_desc': { zh: '行政审批 — 经过总统审批', en: 'Executive — President approval required' },
  'level.l3_desc': { zh: '立法审议 — 经过两院投票表决', en: 'Legislative — Both chambers vote' },
  'level.l4_desc': { zh: '全面审查 — 含最高法院违宪审查', en: 'Full Review — Includes Supreme Court review' },

  // ── Status Bar ──
  'status.connected': { zh: '已连接', en: 'Connected' },
  'status.disconnected': { zh: '断开', en: 'Disconnected' },
  'status.help': { zh: '帮助', en: 'Help' },
  'status.l1': { zh: '闪电回复', en: 'Quick' },
  'status.l2': { zh: '行政处理', en: 'Executive' },
  'status.l3': { zh: '立法审议', en: 'Legislative' },
  'status.l4': { zh: '三权会审', en: 'Full Review' },

  // ── State Labels ──
  'state.intake': { zh: '接收中', en: 'Intake' },
  'state.drafting': { zh: '起草中', en: 'Drafting' },
  'state.house_review': { zh: '众院审议', en: 'House Review' },
  'state.senate_review': { zh: '参院审议', en: 'Senate Review' },
  'state.president_review': { zh: '总统审批', en: 'President Review' },
  'state.vetoed': { zh: '已否决', en: 'Vetoed' },
  'state.override_vote': { zh: '推翻投票', en: 'Override Vote' },
  'state.executing': { zh: '执行中', en: 'Executing' },
  'state.judicial_review': { zh: '违宪审查', en: 'Judicial Review' },
  'state.enacted': { zh: '已生效', en: 'Enacted' },
  'state.unconstitutional': { zh: '违宪', en: 'Unconstitutional' },
  'state.tabled': { zh: '已搁置', en: 'Tabled' },

  // ── Agent Names ──
  'agent.president': { zh: '总统', en: 'President' },
  'agent.chief_of_staff': { zh: '幕僚长', en: 'Chief of Staff' },
  'agent.sec_strategy': { zh: '战略部长', en: 'Sec. of Strategy' },
  'agent.sec_research': { zh: '研究部长', en: 'Sec. of Research' },
  'agent.sec_operations': { zh: '执行部长', en: 'Sec. of Operations' },
  'agent.sec_quality': { zh: '质量部长', en: 'Sec. of Quality' },
  'agent.attorney_general': { zh: '总检察长', en: 'Attorney General' },
  'agent.speaker_house': { zh: '众议院议长', en: 'Speaker of the House' },
  'agent.senate_leader': { zh: '参议院领袖', en: 'Senate Leader' },
  'agent.house_committee': { zh: '众院委员会', en: 'House Committee' },
  'agent.senate_committee': { zh: '参院委员会', en: 'Senate Committee' },
  'agent.cbo': { zh: '预算办公室', en: 'Budget Office (CBO)' },
  'agent.chief_justice': { zh: '首席大法官', en: 'Chief Justice' },
  'agent.justice_progressive': { zh: '进步派大法官', en: 'Progressive Justice' },
  'agent.justice_originalist': { zh: '保守派大法官', en: 'Originalist Justice' },
  'agent.press_secretary': { zh: '新闻秘书', en: 'Press Secretary' },

  // ── Thinking Panel ──
  'thinking.title': { zh: 'Agent 状态', en: 'Agent Status' },
  'thinking.all_idle': { zh: '所有 Agent 待命中', en: 'All agents on standby' },
  'thinking.idle_section': { zh: '待命中', en: 'Standby' },

  // ── Vote Board ──
  'vote.title': { zh: '投票记录', en: 'Vote Records' },
  'vote.judicial_opinions': { zh: '司法意见', en: 'Judicial Opinions' },
  'vote.constitutional': { zh: '合宪', en: 'Constitutional' },
  'vote.unconstitutional': { zh: '违宪', en: 'Unconstitutional' },

  // ── Result Output ──
  'result.flow_trace': { zh: '流程轨迹', en: 'Flow Trace' },
  'result.final': { zh: '最终结果', en: 'Final Result' },
  'result.unconstitutional': { zh: '违宪裁定', en: 'Unconstitutional Ruling' },
  'result.tabled': { zh: '搁置结论', en: 'Tabled Conclusion' },
  'result.bill_draft': { zh: '法案草案', en: 'Bill Draft' },

  // ── Onboarding ──
  'onboard.skip': { zh: '跳过', en: 'Skip' },
  'onboard.prev': { zh: '上一步', en: 'Previous' },
  'onboard.next': { zh: '下一步', en: 'Next' },
  'onboard.start': { zh: '开始使用', en: 'Get Started' },
  'onboard.step1_title': { zh: '欢迎使用 FedAgent', en: 'Welcome to FedAgent' },
  'onboard.step1_content': {
    zh: 'FedAgent 是一个基于三权分立理念的多 AI Agent 协作系统。\n\n你的每个问题都会经过行政、立法、司法三大分支的协作处理，确保回答质量和安全性。',
    en: 'FedAgent is a multi-AI-agent collaboration system based on the separation of powers.\n\nEvery question you ask is processed through the Executive, Legislative, and Judicial branches to ensure quality and safety.',
  },
  'onboard.step2_title': { zh: '任务级别', en: 'Task Levels' },
  'onboard.step2_content': {
    zh: '系统支持四种处理级别：\n\n• L1 快速回复 — 由幕僚长直接回答，最快\n• L2 行政审批 — 经总统审批后执行\n• L3 立法审议 — 需要两院投票表决\n• L4 全面审查 — 含最高法院违宪审查\n\n你可以在输入框左侧选择级别，或让 AI 自动判断。',
    en: 'Four processing levels are available:\n\n• L1 Quick Reply — Chief of Staff answers directly, fastest\n• L2 Executive — Requires President approval\n• L3 Legislative — Both chambers vote\n• L4 Full Review — Includes Supreme Court constitutional review\n\nSelect a level from the input bar, or let AI decide automatically.',
  },
  'onboard.step3_title': { zh: '像素世界', en: 'Pixel World' },
  'onboard.step3_content': {
    zh: '上方的像素画面展示了三权分立的运作过程：\n\n• 白宫 (上方) — 总统和内阁\n• 国会大厦 (左侧) — 众议院和参议院\n• 最高法院 (右侧) — 三位大法官\n• 新闻发布厅 (下方) — 新闻秘书\n\n当 Agent 在思考时，对应的角色会有动画效果。',
    en: 'The pixel scene above visualizes the separation of powers:\n\n• White House (top) — President and Cabinet\n• Capitol (left) — House and Senate\n• Supreme Court (right) — Three Justices\n• Press Room (bottom) — Press Secretary\n\nWhen an agent is thinking, its character animates.',
  },
  'onboard.step4_title': { zh: '快捷操作', en: 'Quick Actions' },
  'onboard.step4_content': {
    zh: '在任务处理过程中，你可以使用快捷按钮：\n\n• ⚡ 快速通道 — 跳过立法环节，降级为 L2\n• ⏭ 跳过当前 — 跳过当前审议阶段\n• ⏹ 终止任务 — 立即终止处理\n\n使用 Ctrl+N 可以快速创建新对话。',
    en: 'During task processing, you can use quick action buttons:\n\n• ⚡ Fast Track — Skip legislative, downgrade to L2\n• ⏭ Skip — Skip current deliberation stage\n• ⏹ Stop — Terminate processing immediately\n\nPress Ctrl+N to quickly create a new conversation.',
  },
}

/**
 * Get translated string for the current locale.
 */
export function t(key: string): string {
  const locale = useUIStore.getState().locale
  return translations[key]?.[locale] ?? key
}

/**
 * React hook that returns a translation function reactive to locale changes.
 */
export function useT(): (key: string) => string {
  const locale = useUIStore(s => s.locale)
  return (key: string) => translations[key]?.[locale] ?? key
}

/**
 * Get agent display name for the current locale.
 */
export function getAgentName(agentId: string): string {
  return t(`agent.${agentId}`) || agentId
}

/**
 * Get state label for the current locale.
 */
export function getStateLabel(state: string): string {
  return t(`state.${state}`) || state
}
