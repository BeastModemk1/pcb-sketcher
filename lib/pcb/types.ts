export type Layer = 'top' | 'bottom'

export type Point = { x: number; y: number }

export type MaskColor = 'green' | 'blue' | 'red' | 'black' | 'purple' | 'white'

export type Finish = 'gold' | 'silver'

export type FootprintType =
  | 'resistor_axial'
  | 'resistor_0805'
  | 'cap_ceramic'
  | 'cap_electrolytic'
  | 'led_5mm'
  | 'transistor_to92'
  | 'dip8'
  | 'dip14'
  | 'dip16'
  | 'soic8'
  | 'header_1x4'
  | 'header_1x6'
  | 'header_2x5'
  | 'tactile_switch'
  | 'crystal_hc49'
  | 'terminal_2'
  | 'mounting_hole'
  | 'pad_tht'
  | 'pad_smd'
  | 'via'

export interface BoardSettings {
  name: string
  width: number
  height: number
  cornerRadius: number
  maskColor: MaskColor
  finish: Finish
  gridSize: number
}

export interface PcbComponent {
  id: string
  kind: 'component'
  footprint: FootprintType
  x: number
  y: number
  rotation: number
  layer: Layer
  label: string
  value: string
}

export interface PcbTrace {
  id: string
  kind: 'trace'
  points: Point[]
  width: number
  layer: Layer
}

export interface PcbText {
  id: string
  kind: 'text'
  x: number
  y: number
  text: string
  size: number
  rotation: number
  layer: Layer
}

export type PcbItem = PcbComponent | PcbTrace | PcbText

export interface PcbDocument {
  version: 1
  board: BoardSettings
  components: PcbComponent[]
  traces: PcbTrace[]
  texts: PcbText[]
}

export type Tool = 'select' | 'pan' | 'trace' | 'place' | 'text'
