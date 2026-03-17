/**
 * 像素世界常量 — 瓦片大小、调色板
 */

export const TILE_SIZE = 16
export const WORLD_COLS = 64
export const WORLD_ROWS = 44
export const WORLD_W = WORLD_COLS * TILE_SIZE  // 1024
export const WORLD_H = WORLD_ROWS * TILE_SIZE  // 704

// ── 地形调色板 ──
export const GRASS_COLORS = [0x7EC850, 0x6BBF47, 0x8FD460, 0x5EAE3A]
export const DARK_GRASS = 0x4A9A2E
export const PATH_COLORS = [0xD2B48C, 0xC9A876, 0xDEC49A]
export const WATER_COLOR = 0x5B9BD5
export const SAND_COLOR = 0xF5DEB3

// ── 建筑调色板 ──
export const WALL_EXTERIOR = 0x6B5B4F
export const WALL_INTERIOR = 0x8B7D72
export const FLOOR_WOOD = 0xDEB887
export const FLOOR_CARPET_RED = 0xA0522D
export const FLOOR_CARPET_BLUE = 0x6B8E9B
export const FLOOR_TILE = 0xD3D3D3
export const FLOOR_MARBLE = 0xE8E0D8
export const ROOF_COLOR = 0x8B4513

// ── 家具颜色 ──
export const DESK_COLOR = 0x8B6914
export const CHAIR_COLOR = 0x654321
export const BOOKSHELF_COLOR = 0x5C3317
export const PODIUM_COLOR = 0x704214
export const BED_COLOR = 0x4169E1

// ── 自然物颜色 ──
export const TREE_CANOPY = [0x2E8B2E, 0x3A9D3A, 0x228B22]
export const TREE_TRUNK = 0x8B4513
export const FLOWER_COLORS = [0xFF6B6B, 0xFFD93D, 0xC084FC, 0xFBFBFB]

// ── Agent 颜色 ──
export const AGENT_COLORS: Record<string, number> = {
  president: 0xFF6B6B,
  chief_of_staff: 0x4ECDC4,
  sec_strategy: 0x45B7D1,
  sec_research: 0x96CEB4,
  sec_operations: 0xFFA07A,
  sec_quality: 0xDDA0DD,
  attorney_general: 0xF0E68C,
  speaker_house: 0xFF9F43,
  senate_leader: 0xEE5A24,
  house_committee: 0x7B68EE,
  senate_committee: 0x20B2AA,
  cbo: 0xB8860B,
  chief_justice: 0xDC143C,
  justice_progressive: 0x00CED1,
  justice_originalist: 0xCD853F,
  press_secretary: 0x9370DB,
}

// ── 分支颜色 ──
export const BRANCH_COLORS = {
  executive: 0x3B82F6,
  legislative: 0xF59E0B,
  judicial: 0xEF4444,
  press: 0x8B5CF6,
}
