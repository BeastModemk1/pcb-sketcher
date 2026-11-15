'use client'

import { FINISH_COLORS, GRID_OPTIONS, MASK_COLORS } from '@/lib/pcb/board'
import type { BoardSettings, Finish, MaskColor } from '@/lib/pcb/types'
import { cn } from '@/lib/utils'
import { NumberField, Segmented, TextField } from './fields'

export function BoardSettingsFields({
  board,
  onChange,
}: {
  board: BoardSettings
  onChange: (patch: Partial<BoardSettings>) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <TextField label="Board name" value={board.name} onChange={(name) => onChange({ name })} />
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width" suffix="mm" value={board.width} min={5} max={500} step={1} onCommit={(width) => onChange({ width })} />
        <NumberField label="Height" suffix="mm" value={board.height} min={5} max={500} step={1} onCommit={(height) => onChange({ height })} />
      </div>
      <NumberField
        label="Corner radius"
        suffix="mm"
        value={board.cornerRadius}
        min={0}
        max={Math.min(board.width, board.height) / 2}
        step={0.5}
        onCommit={(cornerRadius) => onChange({ cornerRadius })}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">Solder mask</span>
        <div role="radiogroup" aria-label="Solder mask color" className="flex flex-wrap gap-2">
          {(Object.keys(MASK_COLORS) as MaskColor[]).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={board.maskColor === key}
              aria-label={MASK_COLORS[key].label}
              title={MASK_COLORS[key].label}
              onClick={() => onChange({ maskColor: key })}
              className={cn(
                'size-7 rounded-full border border-white/15 ring-offset-2 ring-offset-card transition',
                board.maskColor === key && 'ring-2 ring-primary',
              )}
              style={{ backgroundColor: MASK_COLORS[key].substrate }}
            />
          ))}
        </div>
      </div>
      <Segmented<Finish>
        label="Surface finish"
        value={board.finish}
        options={(Object.keys(FINISH_COLORS) as Finish[]).map((f) => ({
          value: f,
          label: (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: FINISH_COLORS[f].color }} />
              {f === 'gold' ? 'ENIG' : 'HASL'}
            </span>
          ),
        }))}
        onChange={(finish) => onChange({ finish })}
      />
      <Segmented<number>
        label="Grid (mm)"
        value={board.gridSize}
        options={GRID_OPTIONS.map((g) => ({ value: g, label: String(g) }))}
        onChange={(gridSize) => onChange({ gridSize })}
      />
    </div>
  )
}
