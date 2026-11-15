'use client'

import {
  Download,
  FilePlus2,
  FolderOpen,
  Grid3x3,
  ImageDown,
  Maximize,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { Layer } from '@/lib/pcb/types'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

interface TopBarProps {
  boardName: string
  canUndo: boolean
  canRedo: boolean
  activeLayer: Layer
  showGrid: boolean
  angleSnap: boolean
  zoomPercent: number
  onNew: () => void
  onOpen: (file: File) => void
  onSave: () => void
  onExportSvg: () => void
  onExportPng: () => void
  onUndo: () => void
  onRedo: () => void
  onLayer: (layer: Layer) => void
  onToggleGrid: () => void
  onToggleAngleSnap: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

export function TopBar(props: TopBarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <div className="flex items-center gap-2 pr-2">
        <Logo className="size-6" />
        <span className="hidden text-sm font-semibold tracking-tight lg:inline">Tracewright</span>
      </div>
      <Divider />
      <h1 className="max-w-40 truncate text-sm text-muted-foreground" title={props.boardName}>
        {props.boardName}
      </h1>
      <Divider />

      <IconButton label="New board" onClick={props.onNew}>
        <FilePlus2 />
      </IconButton>
      <IconButton label="Open design (.json)" onClick={() => fileRef.current?.click()}>
        <FolderOpen />
      </IconButton>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) props.onOpen(file)
          e.target.value = ''
        }}
      />
      <IconButton label="Save design (Ctrl+S)" onClick={props.onSave}>
        <Save />
      </IconButton>
      <IconButton label="Export SVG" onClick={props.onExportSvg}>
        <Download />
      </IconButton>
      <IconButton label="Export PNG" onClick={props.onExportPng}>
        <ImageDown />
      </IconButton>
      <Divider />
      <IconButton label="Undo (Ctrl+Z)" onClick={props.onUndo} disabled={!props.canUndo}>
        <Undo2 />
      </IconButton>
      <IconButton label="Redo (Ctrl+Shift+Z)" onClick={props.onRedo} disabled={!props.canRedo}>
        <Redo2 />
      </IconButton>

      <div className="ml-auto flex items-center gap-2">
        <div role="radiogroup" aria-label="Active copper layer (L)" className="flex rounded-md border border-input bg-input/20 p-0.5">
          {(['top', 'bottom'] as Layer[]).map((layer) => (
            <button
              key={layer}
              type="button"
              role="radio"
              aria-checked={props.activeLayer === layer}
              onClick={() => props.onLayer(layer)}
              title="Switch layer (L)"
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium capitalize transition-colors',
                props.activeLayer === layer ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn('size-2 rounded-full', layer === 'top' ? 'bg-[#e36b3b]' : 'bg-[#4f8fe0]')}
                aria-hidden="true"
              />
              {layer}
            </button>
          ))}
        </div>
        <Divider />
        <ToggleButton label="Grid (G)" pressed={props.showGrid} onClick={props.onToggleGrid}>
          <Grid3x3 />
        </ToggleButton>
        <ToggleButton label="45° routing (A)" pressed={props.angleSnap} onClick={props.onToggleAngleSnap}>
          <span className="font-mono text-[11px] font-semibold">45°</span>
        </ToggleButton>
        <Divider />
        <IconButton label="Zoom out (-)" onClick={props.onZoomOut}>
          <ZoomOut />
        </IconButton>
        <span className="w-12 text-center font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
          {props.zoomPercent}%
        </span>
        <IconButton label="Zoom in (+)" onClick={props.onZoomIn}>
          <ZoomIn />
        </IconButton>
        <IconButton label="Fit board (0)" onClick={props.onFit}>
          <Maximize />
        </IconButton>
      </div>
    </header>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Button variant="ghost" size="icon-sm" onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {children}
    </Button>
  )
}

function ToggleButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded-md transition-colors [&_svg]:size-4',
        pressed ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
