'use client'

import { CircleDot, Hand, MousePointer2, Spline, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import { FOOTPRINTS, LIBRARY_ORDER } from '@/lib/pcb/footprints'
import type { FootprintType, Tool } from '@/lib/pcb/types'
import { cn } from '@/lib/utils'
import { FootprintGraphic, type Palette } from './artwork'
import { SectionTitle } from './fields'

interface ToolPaletteProps {
  tool: Tool
  placeFootprint: FootprintType
  palette: Palette
  onTool: (tool: Tool) => void
  onPick: (footprint: FootprintType) => void
}

const CATEGORIES = ['Passives', 'Semiconductors', 'Connectors', 'Mechanical'] as const

export function ToolPalette({ tool, placeFootprint, palette, onTool, onPick }: ToolPaletteProps) {
  const viaActive = tool === 'place' && placeFootprint === 'via'
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-card" aria-label="Tools and parts">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <SectionTitle>Tools</SectionTitle>
        <div className="grid grid-cols-5 gap-1">
          <ToolButton label="Select" shortcut="V" active={tool === 'select'} onClick={() => onTool('select')}>
            <MousePointer2 className="size-4" />
          </ToolButton>
          <ToolButton label="Pan" shortcut="H" active={tool === 'pan'} onClick={() => onTool('pan')}>
            <Hand className="size-4" />
          </ToolButton>
          <ToolButton label="Route trace" shortcut="W" active={tool === 'trace'} onClick={() => onTool('trace')}>
            <Spline className="size-4" />
          </ToolButton>
          <ToolButton label="Via" shortcut="O" active={viaActive} onClick={() => onPick('via')}>
            <CircleDot className="size-4" />
          </ToolButton>
          <ToolButton label="Silkscreen text" shortcut="T" active={tool === 'text'} onClick={() => onTool('text')}>
            <Type className="size-4" />
          </ToolButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        {CATEGORIES.map((category) => (
          <section key={category} className="flex flex-col gap-2">
            <SectionTitle>{category}</SectionTitle>
            <ul className="grid grid-cols-2 gap-1.5">
              {LIBRARY_ORDER.filter((f) => FOOTPRINTS[f].category === category).map((type) => {
                const def = FOOTPRINTS[type]
                const active = tool === 'place' && placeFootprint === type
                const { w, h } = def.bounds
                const box = Math.max(w, h * 1.3) + 1
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => onPick(type)}
                      aria-pressed={active}
                      className={cn(
                        'flex w-full flex-col items-center gap-1 rounded-md border p-1.5 text-center transition-colors',
                        active
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted/40 hover:border-border hover:bg-muted',
                      )}
                    >
                      <svg
                        viewBox={`${-box / 2} ${-box / 2.6} ${box} ${box / 1.3}`}
                        className="h-10 w-full rounded-sm"
                        style={{ backgroundColor: palette.substrate }}
                        aria-hidden="true"
                      >
                        <FootprintGraphic def={def} palette={palette} silkWidth={box / 60} />
                      </svg>
                      <span className="line-clamp-1 text-[11px] leading-tight text-foreground/90">{def.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  )
}

function ToolButton({
  label,
  shortcut,
  active,
  onClick,
  children,
}: {
  label: string
  shortcut: string
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label} (${shortcut})`}
      title={`${label} (${shortcut})`}
      className={cn(
        'flex h-9 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
