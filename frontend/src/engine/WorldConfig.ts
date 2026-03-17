/**
 * 像素世界地图配置 — 建筑、房间、路径、自然物
 */
import { WORLD_COLS, WORLD_ROWS } from './constants'

// ── 瓦片类型 ──
export enum TileType {
  GRASS = 0,
  PATH = 1,
  FLOOR = 2,
  WATER = 3,
  SAND = 4,
}

// ── 房间定义 ──
export interface RoomDef {
  name: string
  x: number       // 相对建筑左上角 (tiles)
  y: number
  w: number
  h: number
  floorColor: number
  furniture: FurnitureDef[]
}

export interface FurnitureDef {
  type: 'desk' | 'chair' | 'podium' | 'bookshelf' | 'bench' | 'table'
  x: number  // 相对房间左上角 (tiles)
  y: number
}

// ── 建筑定义 ──
export interface BuildingDef {
  id: string
  label: string
  gridX: number
  gridY: number
  gridW: number
  gridH: number
  rooms: RoomDef[]
  agents: { agentId: string; roomIndex: number }[]
}

// ── 自然物 ──
export interface TreeDef {
  x: number
  y: number
  variant: 0 | 1 | 2
}

export interface FlowerDef {
  x: number
  y: number
  color: number
}

// ═══════════════════════════════════════
// 建筑配置
// ═══════════════════════════════════════

export const BUILDINGS: BuildingDef[] = [
  // ── 白宫 (上方中间) ──
  {
    id: 'white_house',
    label: '白宫 White House',
    gridX: 20, gridY: 3,
    gridW: 24, gridH: 14,
    rooms: [
      { name: '椭圆办公室', x: 0, y: 0, w: 8, h: 7, floorColor: 0xDEB887,
        furniture: [
          { type: 'desk', x: 3, y: 2 }, { type: 'chair', x: 3, y: 3 },
          { type: 'bookshelf', x: 0, y: 0 }, { type: 'bookshelf', x: 0, y: 1 },
        ]},
      { name: '战略室', x: 8, y: 0, w: 8, h: 7, floorColor: 0x6B8E9B,
        furniture: [
          { type: 'table', x: 2, y: 2 }, { type: 'chair', x: 1, y: 2 },
          { type: 'chair', x: 3, y: 2 }, { type: 'chair', x: 2, y: 1 },
          { type: 'chair', x: 2, y: 3 },
        ]},
      { name: '幕僚办公区', x: 16, y: 0, w: 8, h: 7, floorColor: 0xD3D3D3,
        furniture: [
          { type: 'desk', x: 1, y: 1 }, { type: 'desk', x: 4, y: 1 },
          { type: 'desk', x: 1, y: 4 }, { type: 'desk', x: 4, y: 4 },
          { type: 'chair', x: 2, y: 1 }, { type: 'chair', x: 5, y: 1 },
        ]},
      { name: '质量与执行室', x: 0, y: 7, w: 12, h: 7, floorColor: 0xE8E0D8,
        furniture: [
          { type: 'desk', x: 2, y: 2 }, { type: 'desk', x: 6, y: 2 },
          { type: 'bookshelf', x: 9, y: 0 }, { type: 'bookshelf', x: 9, y: 1 },
          { type: 'chair', x: 3, y: 2 }, { type: 'chair', x: 7, y: 2 },
        ]},
      { name: '检察长办公室', x: 12, y: 7, w: 12, h: 7, floorColor: 0xDEB887,
        furniture: [
          { type: 'desk', x: 5, y: 3 }, { type: 'chair', x: 6, y: 3 },
          { type: 'bookshelf', x: 0, y: 0 }, { type: 'bookshelf', x: 0, y: 1 },
          { type: 'bookshelf', x: 0, y: 2 },
        ]},
    ],
    agents: [
      { agentId: 'president', roomIndex: 0 },
      { agentId: 'sec_strategy', roomIndex: 1 },
      { agentId: 'sec_research', roomIndex: 1 },
      { agentId: 'chief_of_staff', roomIndex: 2 },
      { agentId: 'sec_operations', roomIndex: 3 },
      { agentId: 'sec_quality', roomIndex: 3 },
      { agentId: 'attorney_general', roomIndex: 4 },
    ],
  },

  // ── 国会大厦 (左下) ──
  {
    id: 'capitol',
    label: '国会大厦 Capitol',
    gridX: 3, gridY: 22,
    gridW: 26, gridH: 16,
    rooms: [
      { name: '众议院', x: 0, y: 0, w: 13, h: 8, floorColor: 0xA0522D,
        furniture: [
          { type: 'podium', x: 6, y: 1 },
          { type: 'bench', x: 2, y: 3 }, { type: 'bench', x: 5, y: 3 },
          { type: 'bench', x: 8, y: 3 }, { type: 'bench', x: 2, y: 5 },
          { type: 'bench', x: 5, y: 5 }, { type: 'bench', x: 8, y: 5 },
        ]},
      { name: '参议院', x: 13, y: 0, w: 13, h: 8, floorColor: 0x6B8E9B,
        furniture: [
          { type: 'podium', x: 6, y: 1 },
          { type: 'bench', x: 2, y: 3 }, { type: 'bench', x: 5, y: 3 },
          { type: 'bench', x: 8, y: 3 }, { type: 'bench', x: 2, y: 5 },
          { type: 'bench', x: 5, y: 5 }, { type: 'bench', x: 8, y: 5 },
        ]},
      { name: '众院委员会室', x: 0, y: 8, w: 9, h: 8, floorColor: 0xDEB887,
        furniture: [
          { type: 'table', x: 3, y: 3 },
          { type: 'chair', x: 2, y: 3 }, { type: 'chair', x: 4, y: 3 },
          { type: 'chair', x: 3, y: 2 }, { type: 'chair', x: 3, y: 4 },
          { type: 'bookshelf', x: 7, y: 0 },
        ]},
      { name: '参院委员会室', x: 9, y: 8, w: 9, h: 8, floorColor: 0xE8E0D8,
        furniture: [
          { type: 'table', x: 3, y: 3 },
          { type: 'chair', x: 2, y: 3 }, { type: 'chair', x: 4, y: 3 },
          { type: 'chair', x: 3, y: 2 }, { type: 'chair', x: 3, y: 4 },
        ]},
      { name: '预算办公室', x: 18, y: 8, w: 8, h: 8, floorColor: 0xD3D3D3,
        furniture: [
          { type: 'desk', x: 3, y: 2 }, { type: 'chair', x: 4, y: 2 },
          { type: 'desk', x: 3, y: 5 }, { type: 'chair', x: 4, y: 5 },
          { type: 'bookshelf', x: 0, y: 0 },
        ]},
    ],
    agents: [
      { agentId: 'speaker_house', roomIndex: 0 },
      { agentId: 'senate_leader', roomIndex: 1 },
      { agentId: 'house_committee', roomIndex: 2 },
      { agentId: 'senate_committee', roomIndex: 3 },
      { agentId: 'cbo', roomIndex: 4 },
    ],
  },

  // ── 最高法院 (右下) ──
  {
    id: 'supreme_court',
    label: '最高法院 Supreme Court',
    gridX: 38, gridY: 24,
    gridW: 22, gridH: 12,
    rooms: [
      { name: '法庭', x: 0, y: 0, w: 14, h: 12, floorColor: 0xE8E0D8,
        furniture: [
          { type: 'podium', x: 6, y: 1 },
          { type: 'bench', x: 3, y: 4 }, { type: 'bench', x: 7, y: 4 },
          { type: 'bench', x: 3, y: 7 }, { type: 'bench', x: 7, y: 7 },
          { type: 'bookshelf', x: 0, y: 0 }, { type: 'bookshelf', x: 0, y: 1 },
        ]},
      { name: '法官室', x: 14, y: 0, w: 8, h: 6, floorColor: 0xDEB887,
        furniture: [
          { type: 'desk', x: 3, y: 2 }, { type: 'chair', x: 4, y: 2 },
          { type: 'bookshelf', x: 0, y: 0 }, { type: 'bookshelf', x: 6, y: 0 },
        ]},
      { name: '档案室', x: 14, y: 6, w: 8, h: 6, floorColor: 0xD3D3D3,
        furniture: [
          { type: 'bookshelf', x: 1, y: 1 }, { type: 'bookshelf', x: 3, y: 1 },
          { type: 'bookshelf', x: 5, y: 1 }, { type: 'bookshelf', x: 1, y: 3 },
          { type: 'bookshelf', x: 3, y: 3 }, { type: 'bookshelf', x: 5, y: 3 },
        ]},
    ],
    agents: [
      { agentId: 'chief_justice', roomIndex: 0 },
      { agentId: 'justice_progressive', roomIndex: 1 },
      { agentId: 'justice_originalist', roomIndex: 1 },
    ],
  },

  // ── 新闻发布厅 (右上角) ──
  {
    id: 'press_podium',
    label: '新闻发布厅 Press Room',
    gridX: 50, gridY: 6,
    gridW: 10, gridH: 8,
    rooms: [
      { name: '发布厅', x: 0, y: 0, w: 10, h: 8, floorColor: 0xD3D3D3,
        furniture: [
          { type: 'podium', x: 4, y: 1 },
          { type: 'bench', x: 1, y: 4 }, { type: 'bench', x: 4, y: 4 },
          { type: 'bench', x: 7, y: 4 },
          { type: 'bench', x: 1, y: 6 }, { type: 'bench', x: 4, y: 6 },
        ]},
    ],
    agents: [
      { agentId: 'press_secretary', roomIndex: 0 },
    ],
  },
]

// ═══════════════════════════════════════
// 路径定义 (tile坐标数组，将被标记为 PATH)
// ═══════════════════════════════════════

export function generatePaths(): [number, number][] {
  const paths: [number, number][] = []

  // 白宫到国会 (垂直主干道)
  for (let y = 17; y <= 22; y++) {
    for (let x = 15; x <= 17; x++) paths.push([x, y])
  }
  // 白宫门口横路
  for (let x = 15; x <= 44; x++) {
    paths.push([x, 19])
    paths.push([x, 20])
  }
  // 国会门口横路
  for (let x = 3; x <= 29; x++) {
    paths.push([x, 21])
  }
  // 白宫到新闻发布厅
  for (let x = 44; x <= 50; x++) {
    paths.push([x, 15])
    paths.push([x, 16])
  }
  // 新闻发布厅入口
  for (let y = 14; y <= 16; y++) {
    paths.push([54, y])
    paths.push([55, y])
  }
  // 最高法院连接路
  for (let y = 20; y <= 24; y++) {
    paths.push([44, y])
    paths.push([45, y])
  }
  for (let x = 38; x <= 45; x++) {
    paths.push([x, 23])
  }

  return paths
}

// ═══════════════════════════════════════
// 树和花 (散布在空地上)
// ═══════════════════════════════════════

export function generateTrees(): TreeDef[] {
  const trees: TreeDef[] = []
  // 定义一些固定的树位置，避免与建筑/路径重叠
  const positions: [number, number][] = [
    // 左上区域
    [2, 2], [5, 4], [8, 1], [12, 5], [3, 8], [7, 10],
    [1, 14], [5, 16], [10, 12],
    // 右上区域 (新闻发布厅周围)
    [48, 2], [52, 3], [57, 1], [61, 4], [58, 10], [62, 8],
    // 中间空地
    [34, 20], [36, 18],
    // 右侧
    [61, 20], [62, 28], [60, 34],
    // 底部
    [2, 40], [8, 41], [15, 40], [22, 41], [35, 40], [42, 42],
    [50, 40], [55, 42], [60, 40],
    // 建筑之间
    [32, 26], [34, 30], [36, 34],
  ]

  positions.forEach(([x, y], i) => {
    if (x >= 0 && x < WORLD_COLS - 2 && y >= 0 && y < WORLD_ROWS - 3) {
      trees.push({ x, y, variant: (i % 3) as 0 | 1 | 2 })
    }
  })

  return trees
}

export function generateFlowers(): FlowerDef[] {
  const flowers: FlowerDef[] = []
  const flowerColors = [0xFF6B6B, 0xFFD93D, 0xC084FC, 0xFBFBFB]

  // 伪随机种子散布
  const seed = 42
  for (let i = 0; i < 60; i++) {
    const hash = ((seed + i * 7919) * 104729) % (WORLD_COLS * WORLD_ROWS)
    const x = hash % WORLD_COLS
    const y = Math.floor(hash / WORLD_COLS) % WORLD_ROWS
    flowers.push({ x, y, color: flowerColors[i % flowerColors.length] })
  }

  return flowers
}

// ═══════════════════════════════════════
// 生成完整瓦片地图
// ═══════════════════════════════════════

export function generateTileMap(): TileType[][] {
  // 初始化全部为草地
  const map: TileType[][] = Array.from({ length: WORLD_ROWS },
    () => Array(WORLD_COLS).fill(TileType.GRASS)
  )

  // 标记路径
  for (const [x, y] of generatePaths()) {
    if (y >= 0 && y < WORLD_ROWS && x >= 0 && x < WORLD_COLS) {
      map[y][x] = TileType.PATH
    }
  }

  // 标记建筑地板
  for (const bld of BUILDINGS) {
    for (let dy = 0; dy < bld.gridH; dy++) {
      for (let dx = 0; dx < bld.gridW; dx++) {
        const gy = bld.gridY + dy
        const gx = bld.gridX + dx
        if (gy >= 0 && gy < WORLD_ROWS && gx >= 0 && gx < WORLD_COLS) {
          map[gy][gx] = TileType.FLOOR
        }
      }
    }
  }

  return map
}
