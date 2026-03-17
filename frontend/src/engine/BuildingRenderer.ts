/**
 * Building Renderer — top-down buildings with visible rooms, walls, furniture
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { TILE_SIZE, WALL_EXTERIOR, WALL_INTERIOR } from './constants'
import { BUILDINGS, BuildingDef, RoomDef, getBuildingLabel, getRoomName } from './WorldConfig'
import { SpriteFactory } from './SpriteFactory'

interface BuildingVisual {
  container: Container
  glowOverlay: Graphics
  label: Text
  roomLabels: { text: Text; zhName: string }[]
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

    const shadow = new Graphics()
    shadow.rect(3, 3, bw, bh)
    shadow.fill({ color: 0x000000, alpha: 0.2 })
    c.addChild(shadow)

    // Rooms + furniture
    const roomLabels: { text: Text; zhName: string }[] = []
    for (const room of bld.rooms) {
      const rl = this.drawRoom(c, room, factory)
      if (rl) roomLabels.push(rl)
    }

    // Exterior walls
    const walls = new Graphics()
    walls.setStrokeStyle({ width: 3, color: WALL_EXTERIOR })
    walls.rect(0, 0, bw, bh)
    walls.stroke()
    c.addChild(walls)

    // Interior walls
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

    // Entrance door
    const door = new Graphics()
    const doorX = bw / 2 - TILE_SIZE / 2
    door.rect(doorX, bh - 2, TILE_SIZE, 4)
    door.fill(0xDEB887)
    c.addChild(door)

    // Building name label (large + outlined, readable at any zoom)
    const label = new Text({
      text: getBuildingLabel(bld.id),
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

    // Glow overlay
    const glowOverlay = new Graphics()
    glowOverlay.rect(0, 0, bw, bh)
    glowOverlay.fill({ color: 0x3B82F6, alpha: 0.15 })
    glowOverlay.visible = false
    c.addChild(glowOverlay)

    return { container: c, glowOverlay, label, roomLabels }
  }

  private drawRoom(parent: Container, room: RoomDef, factory: SpriteFactory): { text: Text; zhName: string } | null {
    const rx = room.x * TILE_SIZE
    const ry = room.y * TILE_SIZE
    const rw = room.w * TILE_SIZE
    const rh = room.h * TILE_SIZE

    const floor = new Graphics()
    floor.rect(rx, ry, rw, rh)
    floor.fill(room.floorColor)

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

    for (const furn of room.furniture) {
      const furnObj = factory.createFurniture(furn.type)
      furnObj.x = rx + furn.x * TILE_SIZE
      furnObj.y = ry + furn.y * TILE_SIZE
      parent.addChild(furnObj)
    }

    // Room name label (locale-aware)
    const roomLabel = new Text({
      text: getRoomName(room.name),
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

    return { text: roomLabel, zhName: room.name }
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

  /** Update all text labels when locale changes */
  updateLocale() {
    for (const [buildingId, visual] of this.buildings) {
      // Update building label
      const bld = BUILDINGS.find(b => b.id === buildingId)
      if (bld) {
        visual.label.text = getBuildingLabel(bld.id)
        const bw = bld.gridW * TILE_SIZE
        visual.label.x = bw / 2 - visual.label.width / 2
      }
      // Update room labels
      for (const rl of visual.roomLabels) {
        rl.text.text = getRoomName(rl.zhName)
      }
    }
  }

  /** Animation loop */
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
