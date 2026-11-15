import { DRILL_COLOR, FINISH_COLORS, MASK_COLORS } from '@/lib/pcb/board'
import { FOOTPRINTS, type FootprintDef, rotatedBounds } from '@/lib/pcb/footprints'
import type { Layer, PcbComponent, PcbDocument, PcbText, PcbTrace } from '@/lib/pcb/types'

export interface Palette {
  substrate: string
  copper: string
  silk: string
  pad: string
}

export function paletteFor(doc: Pick<PcbDocument, 'board'>): Palette {
  const mask = MASK_COLORS[doc.board.maskColor]
  return { substrate: mask.substrate, copper: mask.copper, silk: mask.silk, pad: FINISH_COLORS[doc.board.finish].color }
}

export function FootprintGraphic({
  def,
  palette,
  showSilk = true,
  silkWidth = 0.15,
}: {
  def: FootprintDef
  palette: Palette
  showSilk?: boolean
  silkWidth?: number
}) {
  return (
    <g>
      {def.pads.map((pad, i) =>
        pad.shape === 'circle' ? (
          <circle key={i} cx={pad.x} cy={pad.y} r={pad.w / 2} fill={palette.pad} />
        ) : (
          <rect
            key={i}
            x={pad.x - pad.w / 2}
            y={pad.y - pad.h / 2}
            width={pad.w}
            height={pad.h}
            rx={pad.shape === 'oval' ? Math.min(pad.w, pad.h) / 2 : 0.08}
            fill={palette.pad}
          />
        ),
      )}
      {def.pads.map((pad, i) =>
        pad.drill ? <circle key={`d${i}`} cx={pad.x} cy={pad.y} r={pad.drill / 2} fill={DRILL_COLOR} /> : null,
      )}
      {showSilk && (
        <g stroke={palette.silk} strokeWidth={silkWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {def.silk.map((s, i) => {
            switch (s.type) {
              case 'rect':
                return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} />
              case 'circle':
                return (
                  <circle
                    key={i}
                    cx={s.cx}
                    cy={s.cy}
                    r={s.r}
                    fill={s.fill ? palette.silk : 'none'}
                    stroke={s.fill ? 'none' : palette.silk}
                  />
                )
              case 'line':
                return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
              case 'path':
                return <path key={i} d={s.d} />
            }
          })}
        </g>
      )}
    </g>
  )
}

export function componentTransform(c: Pick<PcbComponent, 'x' | 'y' | 'rotation' | 'layer'>) {
  return `translate(${c.x} ${c.y}) rotate(${c.rotation})${c.layer === 'bottom' ? ' scale(-1 1)' : ''}`
}

function ComponentNode({ component, palette, dim }: { component: PcbComponent; palette: Palette; dim: boolean }) {
  const def = FOOTPRINTS[component.footprint]
  const { w, h } = def.bounds
  const bounds = rotatedBounds(component)
  return (
    <g data-id={component.id} opacity={dim ? 0.45 : 1}>
      <g transform={componentTransform(component)}>
        <FootprintGraphic def={def} palette={palette} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="transparent" />
      </g>
      {component.label && (
        <text
          x={component.x}
          y={component.y - bounds.h / 2 - 0.5}
          fontSize={1.1}
          fontFamily="ui-monospace, monospace"
          fontWeight={600}
          textAnchor="middle"
          fill={palette.silk}
          style={{ userSelect: 'none' }}
        >
          {component.label}
        </text>
      )}
    </g>
  )
}

function TraceNode({ trace, palette, dim }: { trace: PcbTrace; palette: Palette; dim: boolean }) {
  const d = trace.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return (
    <g data-id={trace.id} opacity={dim ? 0.4 : 1}>
      <path
        d={d}
        stroke={palette.copper}
        strokeWidth={trace.width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={d} stroke="transparent" strokeWidth={Math.max(trace.width + 0.8, 1.2)} fill="none" />
    </g>
  )
}

function TextNode({ text, palette, dim }: { text: PcbText; palette: Palette; dim: boolean }) {
  return (
    <g
      data-id={text.id}
      opacity={dim ? 0.45 : 1}
      transform={`translate(${text.x} ${text.y}) rotate(${text.rotation})${text.layer === 'bottom' ? ' scale(-1 1)' : ''}`}
    >
      <text
        fontSize={text.size}
        fontFamily="ui-monospace, monospace"
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
        fill={palette.silk}
        style={{ userSelect: 'none' }}
      >
        {text.text}
      </text>
    </g>
  )
}

export function BoardArtwork({ doc, activeLayer }: { doc: PcbDocument; activeLayer: Layer }) {
  const palette = paletteFor(doc)
  const { width, height, cornerRadius } = doc.board
  const inactive: Layer = activeLayer === 'top' ? 'bottom' : 'top'
  const isDim = (layer: Layer, smd: boolean) => layer === inactive && smd

  return (
    <g>
      <rect x={0} y={0} width={width} height={height} rx={cornerRadius} fill={palette.substrate} />
      {[inactive, activeLayer].map((layer) => (
        <g key={layer}>
          {doc.traces
            .filter((t) => t.layer === layer)
            .map((t) => (
              <TraceNode key={t.id} trace={t} palette={palette} dim={layer === inactive} />
            ))}
        </g>
      ))}
      {[inactive, activeLayer].map((layer) => (
        <g key={`c-${layer}`}>
          {doc.components
            .filter((c) => c.layer === layer)
            .map((c) => (
              <ComponentNode
                key={c.id}
                component={c}
                palette={palette}
                dim={isDim(c.layer, FOOTPRINTS[c.footprint].smd)}
              />
            ))}
          {doc.texts
            .filter((t) => t.layer === layer)
            .map((t) => (
              <TextNode key={t.id} text={t} palette={palette} dim={layer === inactive} />
            ))}
        </g>
      ))}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={cornerRadius}
        fill="none"
        stroke="#d9b36a"
        strokeOpacity={0.55}
        strokeWidth={0.2}
        pointerEvents="none"
      />
    </g>
  )
}
