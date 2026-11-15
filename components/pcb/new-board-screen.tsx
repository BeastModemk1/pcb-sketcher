'use client'

import { ArrowRight, CircuitBoard } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_BOARD, MASK_COLORS } from '@/lib/pcb/board'
import type { BoardSettings } from '@/lib/pcb/types'
import { BoardSettingsFields } from './board-settings-fields'
import { Logo } from './logo'

const PRESETS: { label: string; width: number; height: number }[] = [
  { label: 'Small', width: 40, height: 30 },
  { label: 'Arduino shield', width: 68.6, height: 53.3 },
  { label: 'Credit card', width: 85.6, height: 54 },
  { label: 'Eurocard', width: 160, height: 100 },
]

export function NewBoardScreen({
  onCreate,
  onExample,
}: {
  onCreate: (board: BoardSettings) => void
  onExample: () => void
}) {
  const [board, setBoard] = useState<BoardSettings>(DEFAULT_BOARD)
  const mask = MASK_COLORS[board.maskColor]
  const ratio = board.width / board.height
  const previewW = ratio >= 1 ? 100 : 100 * ratio
  const previewH = ratio >= 1 ? 100 / ratio : 100

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl md:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-6 p-8">
          <div className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="font-semibold tracking-tight">Tracewright</span>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">Design a circuit board from scratch</h1>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
              Set your board outline, drop in footprints, route copper on the top and bottom layers and label it all
              with silkscreen. No simulation — just layout.
            </p>
          </div>

          <div
            className="flex aspect-[16/10] items-center justify-center rounded-lg border border-border bg-[#0b0d10] p-8"
            aria-hidden="true"
          >
            <svg viewBox="-6 -6 112 112" className="h-full w-full">
              <rect
                x={(100 - previewW) / 2}
                y={(100 - previewH) / 2}
                width={previewW}
                height={previewH}
                rx={(board.cornerRadius / Math.max(board.width, board.height)) * 100}
                fill={mask.substrate}
                stroke="#d9c58f"
                strokeWidth={0.6}
              />
              <text
                x={50}
                y={50}
                fontSize={4}
                fill={mask.silk}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily="ui-monospace, monospace"
              >
                {`${board.width} × ${board.height} mm`}
              </text>
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Presets</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setBoard((b) => ({ ...b, width: p.width, height: p.height }))}
                >
                  {p.label}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {p.width}×{p.height}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 border-t border-border bg-background/40 p-6 md:border-t-0 md:border-l">
          <h2 className="text-sm font-semibold">Board setup</h2>
          <BoardSettingsFields board={board} onChange={(patch) => setBoard((b) => ({ ...b, ...patch }))} />
          <div className="mt-auto flex flex-col gap-2">
            <Button onClick={() => onCreate(board)}>
              Create blank board <ArrowRight />
            </Button>
            <Button variant="ghost" onClick={onExample}>
              <CircuitBoard /> Open example design
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
