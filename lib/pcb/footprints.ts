import type { FootprintType, PcbComponent, Point } from './types'

export interface PadDef {
  x: number
  y: number
  shape: 'circle' | 'rect' | 'oval'
  w: number
  h: number
  drill?: number
}

export type SilkShape =
  | { type: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { type: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { type: 'path'; d: string }

export interface FootprintDef {
  name: string
  category: 'Passives' | 'Semiconductors' | 'Connectors' | 'Mechanical'
  prefix: string
  defaultValue: string
  smd: boolean
  pads: PadDef[]
  silk: SilkShape[]
  bounds: { w: number; h: number }
}

const PITCH = 2.54

function tht(x: number, y: number, size = 1.7, drill = 0.9, square = false): PadDef {
  return { x, y, shape: square ? 'rect' : 'circle', w: size, h: size, drill }
}

function dip(pins: number): FootprintDef {
  const perSide = pins / 2
  const height = perSide * PITCH
  const pads: PadDef[] = []
  for (let i = 0; i < perSide; i++) {
    const y = -((perSide - 1) * PITCH) / 2 + i * PITCH
    pads.push({ x: -3.81, y, shape: i === 0 ? 'rect' : 'oval', w: 2, h: 1.5, drill: 0.8 })
  }
  for (let i = perSide - 1; i >= 0; i--) {
    const y = -((perSide - 1) * PITCH) / 2 + i * PITCH
    pads.push({ x: 3.81, y, shape: 'oval', w: 2, h: 1.5, drill: 0.8 })
  }
  const top = -height / 2
  return {
    name: `DIP-${pins}`,
    category: 'Semiconductors',
    prefix: 'U',
    defaultValue: pins === 8 ? 'NE555' : pins === 14 ? '74HC00' : 'ATtiny',
    smd: false,
    pads,
    silk: [
      {
        type: 'path',
        d: `M -1 ${top} L -2.6 ${top} L -2.6 ${-top} L 2.6 ${-top} L 2.6 ${top} L 1 ${top} A 1 1 0 0 1 -1 ${top}`,
      },
    ],
    bounds: { w: 9.6, h: height + 1 },
  }
}

function header(cols: number, rows: number): FootprintDef {
  const pads: PadDef[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -((cols - 1) * PITCH) / 2 + c * PITCH
      const y = -((rows - 1) * PITCH) / 2 + r * PITCH
      pads.push(tht(x, y, 1.7, 1.0, r === 0 && c === 0))
    }
  }
  const w = cols * PITCH
  const h = rows * PITCH
  return {
    name: `Header ${cols}×${rows}`,
    category: 'Connectors',
    prefix: 'J',
    defaultValue: `${cols * rows}-pin`,
    smd: false,
    pads,
    silk: [{ type: 'rect', x: -w / 2, y: -h / 2, w, h }],
    bounds: { w: w + 0.4, h: h + 0.4 },
  }
}

export const FOOTPRINTS: Record<FootprintType, FootprintDef> = {
  resistor_axial: {
    name: 'Resistor (axial)',
    category: 'Passives',
    prefix: 'R',
    defaultValue: '10k',
    smd: false,
    pads: [tht(-5.08, 0, 1.7, 0.9, true), tht(5.08, 0)],
    silk: [
      { type: 'rect', x: -3, y: -1.1, w: 6, h: 2.2, r: 0.5 },
      { type: 'line', x1: -4.1, y1: 0, x2: -3, y2: 0 },
      { type: 'line', x1: 3, y1: 0, x2: 4.1, y2: 0 },
    ],
    bounds: { w: 12.2, h: 3 },
  },
  resistor_0805: {
    name: 'Resistor 0805',
    category: 'Passives',
    prefix: 'R',
    defaultValue: '1k',
    smd: true,
    pads: [
      { x: -1, y: 0, shape: 'rect', w: 1.1, h: 1.4 },
      { x: 1, y: 0, shape: 'rect', w: 1.1, h: 1.4 },
    ],
    silk: [
      { type: 'line', x1: -0.3, y1: -0.95, x2: 0.3, y2: -0.95 },
      { type: 'line', x1: -0.3, y1: 0.95, x2: 0.3, y2: 0.95 },
    ],
    bounds: { w: 3.4, h: 2.2 },
  },
  cap_ceramic: {
    name: 'Capacitor (ceramic)',
    category: 'Passives',
    prefix: 'C',
    defaultValue: '100nF',
    smd: false,
    pads: [tht(-1.27, 0, 1.6, 0.8, true), tht(1.27, 0, 1.6, 0.8)],
    silk: [{ type: 'rect', x: -2.6, y: -1.3, w: 5.2, h: 2.6, r: 1.2 }],
    bounds: { w: 5.6, h: 3 },
  },
  cap_electrolytic: {
    name: 'Capacitor (electrolytic)',
    category: 'Passives',
    prefix: 'C',
    defaultValue: '10µF',
    smd: false,
    pads: [tht(-1.25, 0, 1.6, 0.8, true), tht(1.25, 0, 1.6, 0.8)],
    silk: [
      { type: 'circle', cx: 0, cy: 0, r: 3.2 },
      { type: 'line', x1: -2.6, y1: -1.9, x2: -1.6, y2: -1.9 },
      { type: 'line', x1: -2.1, y1: -2.4, x2: -2.1, y2: -1.4 },
    ],
    bounds: { w: 7, h: 7 },
  },
  led_5mm: {
    name: 'LED 5mm',
    category: 'Semiconductors',
    prefix: 'D',
    defaultValue: 'Red',
    smd: false,
    pads: [tht(-1.27, 0, 1.7, 0.9, true), tht(1.27, 0)],
    silk: [{ type: 'path', d: 'M 2.9 -1.4 A 3.2 3.2 0 1 0 2.9 1.4 Z' }],
    bounds: { w: 7, h: 7 },
  },
  transistor_to92: {
    name: 'Transistor TO-92',
    category: 'Semiconductors',
    prefix: 'Q',
    defaultValue: '2N3904',
    smd: false,
    pads: [tht(-1.27, 0, 1.3, 0.75, true), tht(0, 0, 1.3, 0.75), tht(1.27, 0, 1.3, 0.75)],
    silk: [{ type: 'path', d: 'M -2.4 1 L 2.4 1 A 2.6 2.6 0 1 0 -2.4 1' }],
    bounds: { w: 5.6, h: 4.4 },
  },
  dip8: dip(8),
  dip14: dip(14),
  dip16: dip(16),
  soic8: {
    name: 'SOIC-8',
    category: 'Semiconductors',
    prefix: 'U',
    defaultValue: 'OPA2134',
    smd: true,
    pads: [
      ...[0, 1, 2, 3].map((i) => ({ x: -2.7, y: -1.905 + i * 1.27, shape: 'rect' as const, w: 1.55, h: 0.6 })),
      ...[3, 2, 1, 0].map((i) => ({ x: 2.7, y: -1.905 + i * 1.27, shape: 'rect' as const, w: 1.55, h: 0.6 })),
    ],
    silk: [
      { type: 'rect', x: -1.95, y: -2.45, w: 3.9, h: 4.9 },
      { type: 'circle', cx: -1.3, cy: -1.8, r: 0.3, fill: true },
    ],
    bounds: { w: 7.2, h: 5.2 },
  },
  header_1x4: header(1, 4),
  header_1x6: header(1, 6),
  header_2x5: header(2, 5),
  tactile_switch: {
    name: 'Tactile switch 6mm',
    category: 'Mechanical',
    prefix: 'SW',
    defaultValue: 'Push',
    smd: false,
    pads: [tht(-3.25, -2.25, 2, 1.1), tht(3.25, -2.25, 2, 1.1), tht(-3.25, 2.25, 2, 1.1), tht(3.25, 2.25, 2, 1.1)],
    silk: [
      { type: 'rect', x: -3, y: -3, w: 6, h: 6, r: 0.3 },
      { type: 'circle', cx: 0, cy: 0, r: 1.75 },
    ],
    bounds: { w: 8.8, h: 7 },
  },
  crystal_hc49: {
    name: 'Crystal HC-49',
    category: 'Passives',
    prefix: 'Y',
    defaultValue: '16MHz',
    smd: false,
    pads: [tht(-2.44, 0, 1.5, 0.8), tht(2.44, 0, 1.5, 0.8)],
    silk: [{ type: 'rect', x: -5.6, y: -2.3, w: 11.2, h: 4.6, r: 2.3 }],
    bounds: { w: 11.6, h: 5 },
  },
  terminal_2: {
    name: 'Screw terminal 2-pin',
    category: 'Connectors',
    prefix: 'J',
    defaultValue: '5.08mm',
    smd: false,
    pads: [tht(-2.54, 0, 2.4, 1.3, true), tht(2.54, 0, 2.4, 1.3)],
    silk: [
      { type: 'rect', x: -5.08, y: -4, w: 10.16, h: 8 },
      { type: 'line', x1: -5.08, y1: 2.6, x2: 5.08, y2: 2.6 },
    ],
    bounds: { w: 10.6, h: 8.4 },
  },
  mounting_hole: {
    name: 'Mounting hole M3',
    category: 'Mechanical',
    prefix: 'H',
    defaultValue: 'M3',
    smd: false,
    pads: [{ x: 0, y: 0, shape: 'circle', w: 6, h: 6, drill: 3.2 }],
    silk: [],
    bounds: { w: 6.4, h: 6.4 },
  },
  pad_tht: {
    name: 'Through-hole pad',
    category: 'Mechanical',
    prefix: 'TP',
    defaultValue: '',
    smd: false,
    pads: [tht(0, 0, 2, 1)],
    silk: [],
    bounds: { w: 2.4, h: 2.4 },
  },
  pad_smd: {
    name: 'SMD pad',
    category: 'Mechanical',
    prefix: 'TP',
    defaultValue: '',
    smd: true,
    pads: [{ x: 0, y: 0, shape: 'rect', w: 1.5, h: 1.5 }],
    silk: [],
    bounds: { w: 1.9, h: 1.9 },
  },
  via: {
    name: 'Via',
    category: 'Mechanical',
    prefix: '',
    defaultValue: '',
    smd: false,
    pads: [{ x: 0, y: 0, shape: 'circle', w: 0.8, h: 0.8, drill: 0.4 }],
    silk: [],
    bounds: { w: 1.2, h: 1.2 },
  },
}

export const LIBRARY_ORDER: FootprintType[] = [
  'resistor_axial',
  'resistor_0805',
  'cap_ceramic',
  'cap_electrolytic',
  'crystal_hc49',
  'led_5mm',
  'transistor_to92',
  'dip8',
  'dip14',
  'dip16',
  'soic8',
  'header_1x4',
  'header_1x6',
  'header_2x5',
  'terminal_2',
  'tactile_switch',
  'mounting_hole',
  'pad_tht',
  'pad_smd',
]

export function localToWorld(c: Pick<PcbComponent, 'x' | 'y' | 'rotation' | 'layer'>, p: Point): Point {
  const px = c.layer === 'bottom' ? -p.x : p.x
  const rad = (c.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { x: c.x + px * cos - p.y * sin, y: c.y + px * sin + p.y * cos }
}

export function padWorldPositions(c: PcbComponent): Point[] {
  return FOOTPRINTS[c.footprint].pads.map((p) => localToWorld(c, p))
}

export function rotatedBounds(c: Pick<PcbComponent, 'footprint' | 'rotation'>) {
  const { w, h } = FOOTPRINTS[c.footprint].bounds
  const quarter = Math.round(c.rotation / 90) % 2 !== 0
  return quarter ? { w: h, h: w } : { w, h }
}
