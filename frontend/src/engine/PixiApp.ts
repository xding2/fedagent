/**
 * PixiJS 应用 — 像素小镇世界引擎
 */
import { Application, Container } from 'pixi.js'
import { WORLD_W, WORLD_H } from './constants'
import { SpriteFactory } from './SpriteFactory'
import { TileMap } from './TileMap'
import { BuildingRenderer } from './BuildingRenderer'
import { AgentRenderer } from './AgentRenderer'

export { BUILDINGS } from './WorldConfig'
export type { BuildingDef as BuildingConfig } from './WorldConfig'

export class DCPixiApp {
  app: Application
  private world: Container
  private spriteFactory!: SpriteFactory
  private tileMap!: TileMap
  private buildingRenderer!: BuildingRenderer
  private agentRenderer!: AgentRenderer
  private viewW = 800
  private viewH = 600
  private initialized = false
  private baseScale = 1
  private zoomLevel = 1
  private panX = 0
  private panY = 0

  constructor() {
    this.app = new Application()
    this.world = new Container()
  }

  async init(canvas: HTMLCanvasElement) {
    try {
      const resolution = Math.min(window.devicePixelRatio || 1, 2)
      await this.app.init({
        canvas,
        width: this.viewW,
        height: this.viewH,
        backgroundColor: 0x5EAE3A,
        antialias: false,
        resolution,
      })

      this.spriteFactory = new SpriteFactory()

      this.tileMap = new TileMap()
      this.tileMap.init(this.spriteFactory)

      this.buildingRenderer = new BuildingRenderer()
      this.buildingRenderer.init(this.spriteFactory)

      this.agentRenderer = new AgentRenderer()
      this.agentRenderer.init(this.spriteFactory)

      this.world.addChild(this.tileMap.container)
      this.world.addChild(this.buildingRenderer.container)
      this.world.addChild(this.agentRenderer.container)

      this.app.stage.addChild(this.world)
      this.fitWorld()

      this.app.ticker.add(() => this.tick())
      this.initialized = true

      console.log('[PixiApp] 像素世界初始化完成')
    } catch (e) {
      console.error('[PixiApp] 初始化失败:', e)
    }
  }

  resize(w: number, h: number) {
    if (!this.initialized) return
    this.viewW = w
    this.viewH = h
    this.app.renderer.resize(w, h)
    this.fitWorld()
  }

  private fitWorld() {
    const scaleX = this.viewW / WORLD_W
    const scaleY = this.viewH / WORLD_H
    this.baseScale = Math.min(scaleX, scaleY)
    this.applyTransform()
  }

  private applyTransform() {
    const scale = this.baseScale * this.zoomLevel
    this.world.scale.set(scale, scale)
    this.world.x = (this.viewW - WORLD_W * scale) / 2 + this.panX
    this.world.y = (this.viewH - WORLD_H * scale) / 2 + this.panY
  }

  /** 设置缩放级别 (0.5 ~ 3.0) */
  setZoom(level: number) {
    this.zoomLevel = Math.max(0.5, Math.min(3, level))
    this.applyTransform()
  }

  /** 获取当前缩放级别 */
  getZoom(): number {
    return this.zoomLevel
  }

  /** 平移 */
  pan(dx: number, dy: number) {
    this.panX += dx
    this.panY += dy
    this.applyTransform()
  }

  /** 重置视角 */
  resetView() {
    this.zoomLevel = 1
    this.panX = 0
    this.panY = 0
    this.applyTransform()
  }

  setBuildingGlow(buildingId: string, active: boolean) {
    if (!this.initialized) return
    this.buildingRenderer.setBuildingGlow(buildingId, active)
  }

  setAgentAnimation(agentId: string, state: string) {
    if (!this.initialized) return
    this.agentRenderer.setAgentAnimation(agentId, state)
  }

  updateThinkingText(agentId: string, text: string) {
    if (!this.initialized) return
    this.agentRenderer.updateThinkingText(agentId, text)
  }

  private tick() {
    if (!this.initialized) return
    this.buildingRenderer.tick()
    this.agentRenderer.tick()
  }

  destroy() {
    this.initialized = false
    this.spriteFactory?.destroy()
    this.tileMap?.destroy()
    this.buildingRenderer?.destroy()
    this.agentRenderer?.destroy()
    this.app.destroy(true)
  }
}
