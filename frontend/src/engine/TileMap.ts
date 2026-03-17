/**
 * 瓦片地图渲染器 — 绘制地形层（草地、路径、花朵、树木）
 */
import { Container, Graphics } from 'pixi.js'
import { TILE_SIZE, GRASS_COLORS, DARK_GRASS, PATH_COLORS, WORLD_COLS, WORLD_ROWS } from './constants'
import { TileType, generateTileMap, generateTrees, generateFlowers } from './WorldConfig'
import { SpriteFactory } from './SpriteFactory'

export class TileMap {
  container: Container

  constructor() {
    this.container = new Container()
  }

  init(factory: SpriteFactory) {
    const map = generateTileMap()
    this.drawTerrain(map)
    this.drawFlowers(factory, map)
    this.drawTrees(factory, map)
  }

  private drawTerrain(map: TileType[][]) {
    const chunkSize = 16
    for (let cy = 0; cy < WORLD_ROWS; cy += chunkSize) {
      for (let cx = 0; cx < WORLD_COLS; cx += chunkSize) {
        const chunk = new Graphics()

        for (let dy = 0; dy < chunkSize; dy++) {
          for (let dx = 0; dx < chunkSize; dx++) {
            const gy = cy + dy
            const gx = cx + dx
            if (gy >= WORLD_ROWS || gx >= WORLD_COLS) continue

            const tile = map[gy][gx]
            const px = gx * TILE_SIZE
            const py = gy * TILE_SIZE

            if (tile === TileType.GRASS) {
              const colorIdx = ((gx * 7 + gy * 13 + 37) % GRASS_COLORS.length)
              chunk.rect(px, py, TILE_SIZE, TILE_SIZE)
              chunk.fill(GRASS_COLORS[colorIdx])

              // 草地细节点
              if ((gx + gy) % 5 === 0) {
                chunk.rect(px + 3, py + 5, 1, 1)
                chunk.fill(DARK_GRASS)
              }
              if ((gx * 3 + gy * 7) % 11 === 0) {
                chunk.rect(px + 9, py + 11, 1, 2)
                chunk.fill(DARK_GRASS)
              }
            } else if (tile === TileType.PATH) {
              const pathIdx = (gx + gy) % PATH_COLORS.length
              chunk.rect(px, py, TILE_SIZE, TILE_SIZE)
              chunk.fill(PATH_COLORS[pathIdx])

              // 路面碎石
              if ((gx * 11 + gy * 3) % 7 === 0) {
                chunk.rect(px + 5, py + 7, 2, 1)
                chunk.fill(0xBFA870)
              }
            }
            // FLOOR tiles 由 BuildingRenderer 处理
          }
        }

        this.container.addChild(chunk)
      }
    }
  }

  private drawFlowers(factory: SpriteFactory, map: TileType[][]) {
    const flowers = generateFlowers()
    const flowerColors = [0xFF6B6B, 0xFFD93D, 0xC084FC, 0xFBFBFB]

    for (const f of flowers) {
      if (f.y >= WORLD_ROWS || f.x >= WORLD_COLS) continue
      if (map[f.y]?.[f.x] !== TileType.GRASS) continue

      const flower = factory.createFlower(f.color)
      flower.x = f.x * TILE_SIZE
      flower.y = f.y * TILE_SIZE
      this.container.addChild(flower)
    }
  }

  private drawTrees(factory: SpriteFactory, map: TileType[][]) {
    const trees = generateTrees()
    for (const t of trees) {
      if (t.y >= WORLD_ROWS - 2 || t.x >= WORLD_COLS - 1) continue
      if (map[t.y]?.[t.x] !== TileType.GRASS) continue

      const tree = factory.createTree(t.variant)
      tree.x = t.x * TILE_SIZE
      tree.y = t.y * TILE_SIZE
      this.container.addChild(tree)
    }
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
