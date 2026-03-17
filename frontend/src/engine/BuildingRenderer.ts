/**
 * 建筑渲染器 — 俯视图建筑，可见内部房间、墙壁、家具
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { TILE_SIZE, WALL_EXTERIOR, WALL_INTERIOR } from './constants'
import { BUILDINGS, BuildingDef, RoomDef } from './WorldConfig'
import { SpriteFactory } from './SpriteFactory'

interface BuildingVisual {
  container: Container
  glowOverlay: Graphics
}

export class BuildingRenderer {
  container: Container
  private buildings = new Map<string, BuildingVisual>()
  private glowTimers = new Map<string, number>()

  constructor() {
    this.container = new Container()
  }

  init(factory: SpriteFactory) {
    for (const bld of BUILDINGS) {
      const visual = this.createBuilding(bld, factory)
      this.buildings.set(bld.id, visual)
      this.container.addChild(visual.container)
    }
  }

  private createBuilding(bld: BuildingDef, factory: SpriteFactory): BuildingVisual {
    const c = new Container()
    c.x = bld.gridX * TILE_SIZE
    c.y = bld.gridY * TILE_SIZE
    const bw = bld.gridW * TILE_SIZE
    const bh = bld.gridH * TILE_SIZE

    // 建筑阴影
    const shadow = new Graphics()
    shadow.rect(3, 3, bw, bh)
    shadow.fill({ color: 0x000000, alpha: 0.2 })
    c.addChild(shadow)

    // 房间地板 + 家具
    for (const room of bld.rooms) {
      this.drawRoom(c, room, factory)
    }

    // 外墙
    const walls = new Graphics()
    walls.setStrokeStyle({ width: 3, color: WALL_EXTERIOR })
    walls.rect(0, 0, bw, bh)
    walls.stroke()
    c.addChild(walls)

    // 内墙
    const innerWalls = new Graphics()
    innerWalls.setStrokeStyle({ width: 1, color: WALL_INTERIOR })
    for (const room of bld.rooms) {
      const rx = room.x * TILE_SIZE
      const ry = room.y * TILE_SIZE
      const rw = room.w * TILE_SIZE
      const rh = room.h * TILE_SIZE
      innerWalls.rect(rx, ry, rw, rh)
      innerWalls.stroke()
    }
    c.addChild(innerWalls)

    // 入口门
    const door = new Graphics()
    const doorX = bw / 2 - TILE_SIZE / 2
    door.rect(doorX, bh - 2, TILE_SIZE, 4)
    door.fill(0xDEB887)
    c.addChild(door)

    // 建筑名称 (大号+描边，任何缩放下可读)
    const label = new Text({
      text: bld.label,
      style: new TextStyle({
        fontFamily: 'Inter, Microsoft YaHei, sans-serif',
        fontSize: 13,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 3 },
      }),
    })
    label.x = bw / 2 - label.width / 2
    label.y = -18
    c.addChild(label)

    // 发光叠加层
    const glowOverlay = new Graphics()
    glowOverlay.rect(0, 0, bw, bh)
    glowOverlay.fill({ color: 0x3B82F6, alpha: 0.15 })
    glowOverlay.visible = false
    c.addChild(glowOverlay)

    return { container: c, glowOverlay }
  }

  private drawRoom(parent: Container, room: RoomDef, factory: SpriteFactory) {
    const rx = room.x * TILE_SIZE
    const ry = room.y * TILE_SIZE
    const rw = room.w * TILE_SIZE
    const rh = room.h * TILE_SIZE

    // 地板
    const floor = new Graphics()
    floor.rect(rx, ry, rw, rh)
    floor.fill(room.floorColor)

    // 地板纹理线
    floor.setStrokeStyle({ width: 0.5, color: 0x000000, alpha: 0.06 })
    for (let dx = 1; dx < room.w; dx++) {
      floor.moveTo(rx + dx * TILE_SIZE, ry)
      floor.lineTo(rx + dx * TILE_SIZE, ry + rh)
      floor.stroke()
    }
    for (let dy = 1; dy < room.h; dy++) {
      floor.moveTo(rx, ry + dy * TILE_SIZE)
      floor.lineTo(rx + rw, ry + dy * TILE_SIZE)
      floor.stroke()
    }
    parent.addChild(floor)

    // 家具
    for (const furn of room.furniture) {
      const furnObj = factory.createFurniture(furn.type)
      furnObj.x = rx + furn.x * TILE_SIZE
      furnObj.y = ry + furn.y * TILE_SIZE
      parent.addChild(furnObj)
    }

    // 房间名标签
    const roomLabel = new Text({
      text: room.name,
      style: new TextStyle({
        fontFamily: 'Inter, Microsoft YaHei, sans-serif',
        fontSize: 7,
        fill: 0x666666,
      }),
    })
    roomLabel.x = rx + 2
    roomLabel.y = ry + 1
    roomLabel.alpha = 0.6
    parent.addChild(roomLabel)
  }

  /** 设置建筑发光 */
  setBuildingGlow(buildingId: string, active: boolean) {
    const visual = this.buildings.get(buildingId)
    if (!visual) return

    if (active) {
      visual.glowOverlay.visible = true
      this.glowTimers.set(buildingId, Date.now())
    } else {
      visual.glowOverlay.visible = false
      this.glowTimers.delete(buildingId)
    }
  }

  /** 动画循环 */
  tick() {
    const now = Date.now()
    this.glowTimers.forEach((startTime, buildingId) => {
      const visual = this.buildings.get(buildingId)
      if (visual) {
        const t = (now - startTime) / 1000
        visual.glowOverlay.alpha = 0.08 + 0.12 * Math.sin(t * 3)
      }
    })
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
