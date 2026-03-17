/**
 * Agent Renderer — 16x16 pixel characters with animation and speech bubbles
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { TILE_SIZE } from './constants'
import { BUILDINGS } from './WorldConfig'
import { SpriteFactory } from './SpriteFactory'
import { useUIStore } from '../stores/uiStore'

interface AgentVisual {
  container: Container
  nameLabel: Text
  bubble: Container | null
  bubbleText: Text | null
  buildingId: string
  baseX: number
  baseY: number
  state: string
  animTimer: number
}

export class AgentRenderer {
  container: Container
  private agents = new Map<string, AgentVisual>()

  constructor() {
    this.container = new Container()
  }

  init(factory: SpriteFactory) {
    for (const bld of BUILDINGS) {
      const roomAgentCount: Record<number, number> = {}

      for (const { agentId, roomIndex } of bld.agents) {
        const room = bld.rooms[roomIndex]
        if (!room) continue

        const count = roomAgentCount[roomIndex] || 0
        roomAgentCount[roomIndex] = count + 1

        const pos = this.findAgentPosition(room, count)
        const worldX = (bld.gridX + room.x + pos.x) * TILE_SIZE
        const worldY = (bld.gridY + room.y + pos.y) * TILE_SIZE

        this.createAgent(factory, agentId, worldX, worldY, bld.id)
      }
    }
  }

  private findAgentPosition(room: { w: number; h: number; furniture: { x: number; y: number }[] }, index: number) {
    const cx = Math.floor(room.w / 2)
    const cy = Math.floor(room.h / 2)
    const offsets = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [2, 0], [-2, 0], [0, 2], [0, -2],
    ]
    const furnSet = new Set(room.furniture.map(f => `${f.x},${f.y}`))

    for (let i = index; i < offsets.length + index; i++) {
      const [dx, dy] = offsets[i % offsets.length]
      const px = cx + dx
      const py = cy + dy
      if (px >= 0 && px < room.w && py >= 0 && py < room.h && !furnSet.has(`${px},${py}`)) {
        return { x: px, y: py }
      }
    }
    return { x: cx, y: cy }
  }

  private createAgent(factory: SpriteFactory, agentId: string, x: number, y: number, buildingId: string) {
    const c = new Container()
    c.x = x
    c.y = y

    const sprite = factory.createAgent(agentId)
    c.addChild(sprite)

    // Name label with black outline for readability
    const locale = useUIStore.getState().locale
    const names = locale === 'en' ? AGENT_SHORT_NAMES_EN : AGENT_SHORT_NAMES_ZH
    const name = names[agentId] || agentId
    const nameLabel = new Text({
      text: name,
      style: new TextStyle({
        fontFamily: 'Inter, Microsoft YaHei, sans-serif',
        fontSize: 9,
        fill: 0xFFFFFF,
        stroke: { color: 0x000000, width: 2 },
      }),
    })
    nameLabel.x = TILE_SIZE / 2 - nameLabel.width / 2
    nameLabel.y = TILE_SIZE + 1
    c.addChild(nameLabel)

    this.container.addChild(c)
    this.agents.set(agentId, {
      container: c,
      nameLabel,
      bubble: null,
      bubbleText: null,
      buildingId,
      baseX: x,
      baseY: y,
      state: 'idle',
      animTimer: 0,
    })
  }

  /** Set agent animation state */
  setAgentAnimation(agentId: string, state: string) {
    const agent = this.agents.get(agentId)
    if (!agent) return

    agent.state = state
    agent.animTimer = Date.now()

    const locale = useUIStore.getState().locale
    switch (state) {
      case 'thinking':
        this.showBubble(agentId, locale === 'en' ? 'Thinking...' : '思考中...')
        break
      case 'working':
        this.showBubble(agentId, locale === 'en' ? 'Working...' : '工作中...')
        break
      case 'celebrating':
      case 'rejecting':
      case 'idle':
        this.hideBubble(agentId)
        agent.container.x = agent.baseX
        agent.container.y = agent.baseY
        break
    }
  }

  /** 更新思考泡泡文字 */
  updateThinkingText(agentId: string, text: string) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.bubbleText) return
    agent.bubbleText.text = text.length > 30 ? '...' + text.slice(-27) : text
  }

  private showBubble(agentId: string, text: string) {
    const agent = this.agents.get(agentId)
    if (!agent) return
    this.hideBubble(agentId)

    const bubble = new Container()
    bubble.x = TILE_SIZE / 2
    bubble.y = -8

    const bubbleW = 100
    const bubbleH = 20

    // 泡泡背景
    const bg = new Graphics()
    bg.roundRect(-bubbleW / 2, -bubbleH, bubbleW, bubbleH, 4)
    bg.fill({ color: 0x1E293B, alpha: 0.9 })
    bg.stroke({ width: 1, color: 0x475569 })
    // 三角形指示器
    bg.moveTo(-3, 0)
    bg.lineTo(0, 4)
    bg.lineTo(3, 0)
    bg.fill({ color: 0x1E293B, alpha: 0.9 })
    bubble.addChild(bg)

    // 文字
    const t = new Text({
      text: text.length > 30 ? '...' + text.slice(-27) : text,
      style: new TextStyle({
        fontFamily: 'Inter, Microsoft YaHei, monospace',
        fontSize: 8,
        fill: 0xCBD5E1,
        wordWrap: true,
        wordWrapWidth: bubbleW - 10,
      }),
    })
    t.x = -bubbleW / 2 + 5
    t.y = -bubbleH + 4
    bubble.addChild(t)

    // 状态点
    const dot = new Graphics()
    const dotColor = agent.state === 'thinking' ? 0xFBBF24 : 0x3B82F6
    dot.circle(bubbleW / 2 - 6, -bubbleH / 2, 2)
    dot.fill(dotColor)
    bubble.addChild(dot)

    agent.container.addChild(bubble)
    agent.bubble = bubble
    agent.bubbleText = t
  }

  private hideBubble(agentId: string) {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.bubble) return
    agent.bubble.parent?.removeChild(agent.bubble)
    agent.bubble.destroy({ children: true })
    agent.bubble = null
    agent.bubbleText = null
  }

  /** 动画循环 */
  tick() {
    const now = Date.now()

    this.agents.forEach((agent) => {
      const elapsed = now - agent.animTimer

      switch (agent.state) {
        case 'idle': {
          const bob = Math.sin(now / 800 + agent.baseX) * 0.5
          agent.container.y = agent.baseY + bob
          break
        }
        case 'thinking': {
          const wobble = Math.sin(now / 300) * 1
          agent.container.x = agent.baseX + wobble
          break
        }
        case 'working': {
          const sway = Math.sin(now / 500) * 0.5
          agent.container.y = agent.baseY + sway
          break
        }
        case 'celebrating': {
          if (elapsed < 2000) {
            const jump = Math.abs(Math.sin(elapsed / 200 * Math.PI)) * 4
            agent.container.y = agent.baseY - jump
          } else {
            agent.state = 'idle'
            agent.container.y = agent.baseY
          }
          break
        }
        case 'rejecting': {
          if (elapsed < 500) {
            const shake = Math.sin(elapsed / 30 * Math.PI) * 2
            agent.container.x = agent.baseX + shake
          } else {
            agent.state = 'idle'
            agent.container.x = agent.baseX
          }
          break
        }
      }
    })
  }

  /** Update all text labels when locale changes */
  updateLocale() {
    const locale = useUIStore.getState().locale
    const names = locale === 'en' ? AGENT_SHORT_NAMES_EN : AGENT_SHORT_NAMES_ZH

    this.agents.forEach((agent, agentId) => {
      const name = names[agentId] || agentId
      agent.nameLabel.text = name
      agent.nameLabel.x = TILE_SIZE / 2 - agent.nameLabel.width / 2

      // Update bubble text if active
      if (agent.bubble && agent.bubbleText) {
        if (agent.state === 'thinking') {
          agent.bubbleText.text = locale === 'en' ? 'Thinking...' : '思考中...'
        } else if (agent.state === 'working') {
          agent.bubbleText.text = locale === 'en' ? 'Working...' : '工作中...'
        }
      }
    })
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}

const AGENT_SHORT_NAMES_ZH: Record<string, string> = {
  president: '总统',
  chief_of_staff: '幕僚长',
  sec_strategy: '战略',
  sec_research: '研究',
  sec_operations: '执行',
  sec_quality: '质量',
  attorney_general: '检察长',
  speaker_house: '众议长',
  senate_leader: '参议长',
  house_committee: '众委',
  senate_committee: '参委',
  cbo: '预算',
  chief_justice: '首席法官',
  justice_progressive: '进步派',
  justice_originalist: '保守派',
  press_secretary: '新闻官',
}

const AGENT_SHORT_NAMES_EN: Record<string, string> = {
  president: 'President',
  chief_of_staff: 'CoS',
  sec_strategy: 'Strategy',
  sec_research: 'Research',
  sec_operations: 'Operations',
  sec_quality: 'Quality',
  attorney_general: 'AG',
  speaker_house: 'Speaker',
  senate_leader: 'Sen. Leader',
  house_committee: 'House Com.',
  senate_committee: 'Sen. Com.',
  cbo: 'CBO',
  chief_justice: 'Chief Justice',
  justice_progressive: 'Progressive',
  justice_originalist: 'Originalist',
  press_secretary: 'Press Sec.',
}
