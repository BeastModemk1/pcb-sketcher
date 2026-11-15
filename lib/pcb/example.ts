import { newId } from './board'
import { FOOTPRINTS, padWorldPositions } from './footprints'
import type { FootprintType, Layer, PcbComponent, PcbDocument, PcbTrace, Point } from './types'

function part(footprint: FootprintType, x: number, y: number, label: string, rotation = 0, layer: Layer = 'top'): PcbComponent {
  return { id: newId(), kind: 'component', footprint, x, y, rotation, layer, label, value: FOOTPRINTS[footprint].defaultValue }
}

function trace(points: Point[], width = 0.6, layer: Layer = 'top'): PcbTrace {
  return { id: newId(), kind: 'trace', points, width, layer }
}

export function createExampleDocument(): PcbDocument {
  const u1 = part('dip8', 30, 25.4, 'U1')
  const r1 = part('resistor_axial', 13.97, 15.24, 'R1', 90)
  const r2 = part('resistor_axial', 6.35, 15.24, 'R2', 90)
  const c1 = part('cap_electrolytic', 17.78, 38.1, 'C1')
  const d1 = part('led_5mm', 48.26, 20.32, 'D1', 90)
  const r3 = part('resistor_axial', 48.26, 35.56, 'R3', 90)
  const j1 = part('terminal_2', 8.89, 41.91, 'J1', 90)
  const holes = [
    part('mounting_hole', 4, 4, 'H1'),
    part('mounting_hole', 56, 4, 'H2'),
    part('mounting_hole', 4, 46, 'H3'),
    part('mounting_hole', 56, 46, 'H4'),
  ]

  const [u1p1, u1p2, u1p3, , , u1p6, u1p7, u1p8] = padWorldPositions(u1)
  const [r1a, r1b] = padWorldPositions(r1)
  const [r2a, r2b] = padWorldPositions(r2)
  const [c1a, c1b] = padWorldPositions(c1)
  const [d1a, d1b] = padWorldPositions(d1)
  const [r3a, r3b] = padWorldPositions(r3)
  const [j1a, j1b] = padWorldPositions(j1)

  const via = part('via', 22, 30.48, '')

  const traces: PcbTrace[] = [
    trace([u1p3, { x: 24.6, y: u1p3.y }, { x: 24.6, y: 31 }, { x: 40, y: 31 }, { x: 40, y: d1a.y }, d1a]),
    trace([d1b, r3a]),
    trace([r1b, { x: 13.97, y: u1p2.y }, u1p2]),
    trace([c1a, { x: c1a.x, y: u1p2.y }]),
    trace([c1b, { x: c1b.x, y: 44.45 }]),
    trace([r2b, { x: 6.35, y: 33 }, { x: 36, y: 33 }, { x: 36, y: u1p6.y }, u1p6], 0.6, 'bottom'),
    trace([u1p7, { x: 36.5, y: u1p7.y }, { x: 36.5, y: 12 }, { x: 13.97, y: 12 }, r1a], 0.6, 'bottom'),
    trace([j1a, { x: 2.54, y: j1a.y }, { x: 2.54, y: 7.62 }, { x: 33.81, y: 7.62 }, u1p8], 1),
    trace([r2a, { x: 6.35, y: 7.62 }], 1),
    trace([j1b, { x: 52, y: 44.45 }, { x: 52, y: r3b.y }, r3b], 1),
    trace([u1p1, { x: 22, y: u1p1.y }, { x: 22, y: 30.48 }], 0.6, 'bottom'),
    trace([{ x: 22, y: 30.48 }, { x: 22, y: 44.45 }], 1),
  ]

  return {
    version: 1,
    board: {
      name: '555 LED blinker',
      width: 60,
      height: 50,
      cornerRadius: 3,
      maskColor: 'green',
      finish: 'gold',
      gridSize: 1.27,
    },
    components: [u1, r1, r2, c1, d1, r3, j1, via, ...holes],
    traces,
    texts: [
      { id: newId(), kind: 'text', x: 38, y: 40, text: 'BLINK v1.0', size: 2, rotation: 0, layer: 'top' },
    ],
  }
}
