/**
 * 精灵工厂 — 通过 PixiJS Graphics 程序化生成像素精灵
 * 返回工厂函数，每次调用生成新的 Graphics/Container 实例
 */
import { Container, Graphics } from 'pixi.js'
import {
  TILE_SIZE, AGENT_COLORS, TREE_CANOPY, TREE_TRUNK,
  DESK_COLOR, CHAIR_COLOR, BOOKSHELF_COLOR, PODIUM_COLOR,
} from './constants'

export class SpriteFactory {
  /** 创建树 */
  createTree(variant: 0 | 1 | 2): Container {
    const c = new Container()
    const g = new Graphics()
    const tw = TILE_SIZE * 2
    const th = TILE_SIZE * 3
    const canopyColor = TREE_CANOPY[variant]

    // 树干
    g.rect(tw / 2 - 2, th - TILE_SIZE, 4, TILE_SIZE)
    g.fill(TREE_TRUNK)

    if (variant === 0) {
      g.circle(tw / 2, th - TILE_SIZE - 4, 12)
      g.fill(canopyColor)
      g.circle(tw / 2 - 3, th - TILE_SIZE - 7, 4)
      g.fill(0x4CAF50)
    } else if (variant === 1) {
      g.moveTo(tw / 2, 2)
      g.lineTo(tw / 2 + 12, th - TILE_SIZE)
      g.lineTo(tw / 2 - 12, th - TILE_SIZE)
      g.closePath()
      g.fill(canopyColor)
    } else {
      g.ellipse(tw / 2, th - TILE_SIZE - 2, 14, 10)
      g.fill(canopyColor)
      g.ellipse(tw / 2, th - TILE_SIZE - 6, 10, 6)
      g.fill(0x3CB371)
    }

    c.addChild(g)
    return c
  }

  /** 创建花 */
  createFlower(color: number): Container {
    const c = new Container()
    const g = new Graphics()
    const s = TILE_SIZE
    // 花瓣
    g.circle(s / 2, s / 2 - 2, 2)
    g.fill(color)
    g.circle(s / 2 - 2, s / 2, 2)
    g.fill(color)
    g.circle(s / 2 + 2, s / 2, 2)
    g.fill(color)
    g.circle(s / 2, s / 2 + 2, 2)
    g.fill(color)
    // 花心
    g.circle(s / 2, s / 2, 1.5)
    g.fill(0xFFD700)
    // 茎
    g.rect(s / 2 - 0.5, s / 2 + 3, 1, 4)
    g.fill(0x2E8B2E)
    c.addChild(g)
    return c
  }

  /** 创建家具 */
  createFurniture(type: string): Container {
    const c = new Container()
    const g = new Graphics()
    const s = TILE_SIZE

    switch (type) {
      case 'desk':
        g.rect(1, 2, s - 2, s - 4)
        g.fill(DESK_COLOR)
        g.rect(2, 3, s - 4, s - 6)
        g.fill(0x9B7A2F)
        break
      case 'chair':
        g.rect(3, 3, s - 6, s - 6)
        g.fill(CHAIR_COLOR)
        g.rect(4, 1, s - 8, 3)
        g.fill(CHAIR_COLOR)
        break
      case 'podium':
        g.rect(3, 0, s - 6, s)
        g.fill(PODIUM_COLOR)
        g.rect(4, 1, s - 8, 3)
        g.fill(0x8B6914)
        break
      case 'bookshelf':
        g.rect(0, 0, s, s)
        g.fill(BOOKSHELF_COLOR)
        g.rect(2, 2, 3, s - 4)
        g.fill(0xE74C3C)
        g.rect(6, 2, 3, s - 4)
        g.fill(0x3498DB)
        g.rect(10, 2, 3, s - 4)
        g.fill(0x2ECC71)
        break
      case 'bench':
        g.rect(0, 4, s, s - 8)
        g.fill(CHAIR_COLOR)
        g.rect(0, 3, s, 2)
        g.fill(0x7B5B3A)
        break
      case 'table':
        g.circle(s / 2, s / 2, s / 2 - 1)
        g.fill(DESK_COLOR)
        g.circle(s / 2, s / 2, s / 2 - 3)
        g.fill(0x9B7A2F)
        break
      default:
        g.rect(0, 0, s, s)
        g.fill(0x888888)
    }

    c.addChild(g)
    return c
  }

  /** 创建 Agent 像素角色 */
  createAgent(agentId: string): Container {
    const c = new Container()
    const g = new Graphics()
    const s = TILE_SIZE
    const color = AGENT_COLORS[agentId] || 0xAAAAAA

    // 头 (肤色)
    g.rect(s / 2 - 3, 1, 6, 5)
    g.fill(0xFFDBAC)
    // 头发 (角色色)
    g.rect(s / 2 - 3, 0, 6, 2)
    g.fill(color)
    // 身体
    g.rect(s / 2 - 3, 6, 6, 5)
    g.fill(color)
    // 腿
    g.rect(s / 2 - 3, 11, 2, 4)
    g.fill(0x444466)
    g.rect(s / 2 + 1, 11, 2, 4)
    g.fill(0x444466)
    // 眼睛
    g.rect(s / 2 - 2, 3, 1, 1)
    g.fill(0x333333)
    g.rect(s / 2 + 1, 3, 1, 1)
    g.fill(0x333333)

    c.addChild(g)
    return c
  }

  destroy() {}
}
