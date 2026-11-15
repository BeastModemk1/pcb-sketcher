import type { Layer, Point, Tool } from '@/lib/pcb/types'

const HINTS: Record<Tool, string> = {
  select: 'Click to select · drag to move · drag empty space to pan · scroll to zoom',
  pan: 'Drag to pan the view · scroll to zoom',
  trace: 'Click to add points · click the last point again, Enter or right-click to finish · Shift for free angle',
  place: 'Click to place · R to rotate · Esc to stop placing',
  text: 'Click on the board to add a silkscreen label',
}

export function StatusBar({
  cursor,
  tool,
  placeName,
  drafting,
  grid,
  activeLayer,
}: {
  cursor: Point | null
  tool: Tool
  placeName: string
  drafting: boolean
  grid: number
  activeLayer: Layer
}) {
  const hint =
    tool === 'place' ? `Placing ${placeName} · ${HINTS.place}` : tool === 'trace' && drafting ? `Routing · ${HINTS.trace}` : HINTS[tool]
  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-card px-3 font-mono text-[11px] text-muted-foreground">
      <span className="w-36 tabular-nums">
        {cursor ? `X ${cursor.x.toFixed(2)}  Y ${cursor.y.toFixed(2)}` : 'X —  Y —'}
      </span>
      <span>Grid {grid} mm</span>
      <span className="capitalize">Layer {activeLayer}</span>
      <span className="ml-auto truncate font-sans">{hint}</span>
    </footer>
  )
}
