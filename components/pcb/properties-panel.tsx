'use client'

import { Copy, FlipHorizontal2, RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRACE_WIDTHS, traceLength } from '@/lib/pcb/board'
import { FOOTPRINTS } from '@/lib/pcb/footprints'
import type { BoardSettings, Layer, PcbDocument, PcbItem } from '@/lib/pcb/types'
import { BoardSettingsFields } from './board-settings-fields'
import { NumberField, Segmented, SectionTitle, TextField } from './fields'

interface PropertiesPanelProps {
  doc: PcbDocument
  selected: PcbItem | null
  onBoardChange: (patch: Partial<BoardSettings>) => void
  onItemChange: (patch: Partial<PcbItem>) => void
  onRotate: () => void
  onFlip: () => void
  onDuplicate: () => void
  onDelete: () => void
}

const LAYER_OPTIONS: { value: Layer; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
]

export function PropertiesPanel({
  doc,
  selected,
  onBoardChange,
  onItemChange,
  onRotate,
  onFlip,
  onDuplicate,
  onDelete,
}: PropertiesPanelProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-card" aria-label="Properties">
      {!selected && (
        <div className="flex flex-col gap-5 p-4">
          <div className="flex flex-col gap-1">
            <SectionTitle>Board</SectionTitle>
            <p className="text-xs text-pretty text-muted-foreground">
              Nothing selected. Edit the board itself, or click a part or trace to edit it.
            </p>
          </div>
          <BoardSettingsFields board={doc.board} onChange={onBoardChange} />
          <dl className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/30 p-3 text-center">
            <Stat label="Parts" value={doc.components.filter((c) => c.footprint !== 'via').length} />
            <Stat label="Traces" value={doc.traces.length} />
            <Stat label="Vias" value={doc.components.filter((c) => c.footprint === 'via').length} />
          </dl>
        </div>
      )}

      {selected?.kind === 'component' && (
        <div className="flex flex-col gap-4 p-4">
          <Header title={FOOTPRINTS[selected.footprint].name} subtitle={FOOTPRINTS[selected.footprint].smd ? 'Surface mount' : 'Through hole'} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Designator" value={selected.label} onChange={(label) => onItemChange({ label })} />
            <TextField label="Value" value={selected.value} onChange={(value) => onItemChange({ value })} />
          </div>
          <PositionFields x={selected.x} y={selected.y} onChange={onItemChange} />
          <Segmented<number>
            label="Rotation"
            value={selected.rotation}
            options={[0, 90, 180, 270].map((r) => ({ value: r, label: `${r}°` }))}
            onChange={(rotation) => onItemChange({ rotation })}
          />
          <Segmented<Layer> label="Side" value={selected.layer} options={LAYER_OPTIONS} onChange={(layer) => onItemChange({ layer })} />
          <ItemActions onRotate={onRotate} onFlip={onFlip} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      )}

      {selected?.kind === 'trace' && (
        <div className="flex flex-col gap-4 p-4">
          <Header
            title="Copper trace"
            subtitle={`${selected.points.length} points · ${traceLength(selected.points).toFixed(2)} mm long`}
          />
          <Segmented<number>
            label="Width (mm)"
            value={selected.width}
            options={TRACE_WIDTHS.map((w) => ({ value: w, label: String(w) }))}
            onChange={(width) => onItemChange({ width })}
          />
          <NumberField
            label="Custom width"
            suffix="mm"
            value={selected.width}
            min={0.1}
            max={10}
            step={0.05}
            onCommit={(width) => onItemChange({ width })}
          />
          <Segmented<Layer> label="Copper layer" value={selected.layer} options={LAYER_OPTIONS} onChange={(layer) => onItemChange({ layer })} />
          <p className="text-xs text-pretty text-muted-foreground">Drag the square handles on the board to reshape the trace.</p>
          <ItemActions onDuplicate={onDuplicate} onDelete={onDelete} onFlip={onFlip} />
        </div>
      )}

      {selected?.kind === 'text' && (
        <div className="flex flex-col gap-4 p-4">
          <Header title="Silkscreen text" subtitle="Printed label" />
          <TextField label="Text" value={selected.text} onChange={(text) => onItemChange({ text })} />
          <NumberField label="Size" suffix="mm" value={selected.size} min={0.5} max={20} step={0.1} onCommit={(size) => onItemChange({ size })} />
          <PositionFields x={selected.x} y={selected.y} onChange={onItemChange} />
          <Segmented<number>
            label="Rotation"
            value={selected.rotation}
            options={[0, 90, 180, 270].map((r) => ({ value: r, label: `${r}°` }))}
            onChange={(rotation) => onItemChange({ rotation })}
          />
          <Segmented<Layer> label="Side" value={selected.layer} options={LAYER_OPTIONS} onChange={(layer) => onItemChange({ layer })} />
          <ItemActions onRotate={onRotate} onFlip={onFlip} onDuplicate={onDuplicate} onDelete={onDelete} />
        </div>
      )}
    </aside>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <SectionTitle>Selection</SectionTitle>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="font-mono text-[11px] text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function PositionFields({ x, y, onChange }: { x: number; y: number; onChange: (patch: { x?: number; y?: number }) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumberField label="X" suffix="mm" value={x} step={0.635} onCommit={(v) => onChange({ x: v })} />
      <NumberField label="Y" suffix="mm" value={y} step={0.635} onCommit={(v) => onChange({ y: v })} />
    </div>
  )
}

function ItemActions({
  onRotate,
  onFlip,
  onDuplicate,
  onDelete,
}: {
  onRotate?: () => void
  onFlip?: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <div className="grid grid-cols-2 gap-2">
        {onRotate && (
          <Button variant="outline" size="sm" onClick={onRotate}>
            <RotateCw /> Rotate <Kbd>R</Kbd>
          </Button>
        )}
        {onFlip && (
          <Button variant="outline" size="sm" onClick={onFlip}>
            <FlipHorizontal2 /> Flip <Kbd>F</Kbd>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          <Copy /> Duplicate
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 /> Delete
        </Button>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: string }) {
  return <kbd className="ml-auto rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">{children}</kbd>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="font-mono text-lg font-semibold text-foreground">{value}</dd>
    </div>
  )
}
