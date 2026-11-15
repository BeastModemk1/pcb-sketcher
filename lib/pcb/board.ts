import { FOOTPRINTS } from './footprints'
import type { BoardSettings, Finish, FootprintType, MaskColor, PcbDocument, Point } from './types'

export const MASK_COLORS: Record<MaskColor, { label: string; substrate: string; copper: string; silk: string }> = {
  green: { label: 'Green', substrate: '#0f5132', copper: '#21804d', silk: '#f4f4ee' },
  blue: { label: 'Blue', substrate: '#12397a', copper: '#2558ab', silk: '#f4f4ee' },
  red: { label: 'Red', substrate: '#841b1b', copper: '#b2342e', silk: '#f4f4ee' },
  black: { label: 'Black', substrate: '#151515', copper: '#2f2f2f', silk: '#f4f4ee' },
  purple: { label: 'Purple', substrate: '#3c1f62', copper: '#5c3793', silk: '#f4f4ee' },
  white: { label: 'White', substrate: '#e8e8e2', copper: '#cfd0c8', silk: '#1b1b1b' },
}

export const FINISH_COLORS: Record<Finish, { label: string; color: string }> = {
  gold: { label: 'ENIG (gold)', color: '#d8ad52' },
  silver: { label: 'HASL (silver)', color: '#c7ccd2' },
}

export const DRILL_COLOR = '#0b0d10'

export const DEFAULT_BOARD: BoardSettings = {
  name: 'Untitled board',
  width: 80,
  height: 60,
  cornerRadius: 2,
  maskColor: 'green',
  finish: 'gold',
  gridSize: 1.27,
}

export const GRID_OPTIONS = [0.635, 1.27, 2.54, 5]

export const TRACE_WIDTHS = [0.25, 0.4, 0.6, 1, 1.5, 2]

export function createDocument(board: BoardSettings): PcbDocument {
  return { version: 1, board, components: [], traces: [], texts: [] }
}

export function snap(value: number, grid: number) {
  return Math.round(value / grid) * grid
}

export function snapPoint(p: Point, grid: number): Point {
  return { x: round(snap(p.x, grid)), y: round(snap(p.y, grid)) }
}

export function round(n: number, digits = 3) {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

export function constrain45(from: Point, to: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return to
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
  const projected = dx * Math.cos(angle) + dy * Math.sin(angle)
  return { x: round(from.x + Math.cos(angle) * projected), y: round(from.y + Math.sin(angle) * projected) }
}

export function nextDesignator(doc: PcbDocument, footprint: FootprintType) {
  const prefix = FOOTPRINTS[footprint].prefix
  if (!prefix) return ''
  let max = 0
  for (const c of doc.components) {
    const match = c.label.match(new RegExp(`^${prefix}(\\d+)$`))
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix}${max + 1}`
}

export function traceLength(points: Point[]) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}

export function isPcbDocument(value: unknown): value is PcbDocument {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<PcbDocument>
  return (
    !!v.board &&
    typeof v.board.width === 'number' &&
    typeof v.board.height === 'number' &&
    Array.isArray(v.components) &&
    Array.isArray(v.traces) &&
    Array.isArray(v.texts)
  )
}

export function newId() {
  return crypto.randomUUID()
}
