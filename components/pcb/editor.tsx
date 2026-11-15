'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TRACE_WIDTHS, isPcbDocument, newId, nextDesignator } from '@/lib/pcb/board'
import { duplicateItem, findItem, removeItem, updateItem } from '@/lib/pcb/doc-ops'
import { exportPng, exportSvg, saveJson } from '@/lib/pcb/export'
import { FOOTPRINTS } from '@/lib/pcb/footprints'
import type { BoardSettings, FootprintType, Layer, PcbDocument, PcbItem, Point, Tool } from '@/lib/pcb/types'
import { useHistory } from '@/lib/pcb/use-history'
import { paletteFor } from './artwork'
import { type CanvasController, PcbCanvas } from './pcb-canvas'
import { PropertiesPanel } from './properties-panel'
import { StatusBar } from './status-bar'
import { ToolPalette } from './tool-palette'
import { TopBar } from './top-bar'

export function Editor({ initialDoc, onNewBoard }: { initialDoc: PcbDocument; onNewBoard: () => void }) {
  const history = useHistory<PcbDocument>(initialDoc)
  const doc = history.value
  const { set: setDoc, undo, redo } = history

  const [tool, setToolState] = useState<Tool>('select')
  const [placeFootprint, setPlaceFootprint] = useState<FootprintType>('resistor_axial')
  const [ghostRotation, setGhostRotation] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeLayer, setActiveLayer] = useState<Layer>('top')
  const [traceWidth, setTraceWidth] = useState(0.6)
  const [showGrid, setShowGrid] = useState(true)
  const [angleSnap, setAngleSnap] = useState(true)
  const [draft, setDraftState] = useState<Point[] | null>(null)
  const [cursor, setCursor] = useState<Point | null>(null)
  const [zoom, setZoom] = useState(6)
  const [message, setMessage] = useState<string | null>(null)
  const controllerRef = useRef<CanvasController | null>(null)

  const selected = findItem(doc, selectedId)

  const setDraft = useCallback((updater: (prev: Point[] | null) => Point[] | null) => setDraftState(updater), [])

  const flash = useCallback((text: string) => {
    setMessage(text)
    window.setTimeout(() => setMessage((m) => (m === text ? null : m)), 2500)
  }, [])

  const setTool = useCallback((next: Tool) => {
    setToolState(next)
    setDraftState(null)
    if (next !== 'select') setSelectedId(null)
  }, [])

  const pickFootprint = useCallback(
    (type: FootprintType) => {
      setPlaceFootprint(type)
      setGhostRotation(0)
      setTool('place')
    },
    [setTool],
  )

  const finishDraft = useCallback(() => {
    const points = draft
    setDraftState(null)
    if (!points) return
    const clean = points.filter((p, i) => i === 0 || Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y) > 1e-6)
    if (clean.length < 2) return
    const trace = { id: newId(), kind: 'trace' as const, points: clean, width: traceWidth, layer: activeLayer }
    setDoc((d) => ({ ...d, traces: [...d.traces, trace] }))
  }, [draft, setDoc, traceWidth, activeLayer])

  const placeComponent = useCallback(
    (p: Point) => {
      setDoc((d) => ({
        ...d,
        components: [
          ...d.components,
          {
            id: newId(),
            kind: 'component',
            footprint: placeFootprint,
            x: p.x,
            y: p.y,
            rotation: ghostRotation,
            layer: activeLayer,
            label: nextDesignator(d, placeFootprint),
            value: FOOTPRINTS[placeFootprint].defaultValue,
          },
        ],
      }))
    },
    [setDoc, placeFootprint, ghostRotation, activeLayer],
  )

  const placeText = useCallback(
    (p: Point) => {
      const id = newId()
      setDoc((d) => ({
        ...d,
        texts: [...d.texts, { id, kind: 'text', x: p.x, y: p.y, text: 'TEXT', size: 1.6, rotation: 0, layer: activeLayer }],
      }))
      setToolState('select')
      setSelectedId(id)
    },
    [setDoc, activeLayer],
  )

  const updateSelected = useCallback(
    (patch: Partial<PcbItem>) => {
      if (!selectedId) return
      setDoc((d) => updateItem(d, selectedId, (item) => ({ ...item, ...patch }) as PcbItem))
    },
    [selectedId, setDoc],
  )

  const rotateSelected = useCallback(() => {
    if (!selectedId) return
    setDoc((d) =>
      updateItem(d, selectedId, (item) => (item.kind === 'trace' ? item : { ...item, rotation: (item.rotation + 90) % 360 })),
    )
  }, [selectedId, setDoc])

  const flipSelected = useCallback(() => {
    if (!selectedId) return
    setDoc((d) => updateItem(d, selectedId, (item) => ({ ...item, layer: item.layer === 'top' ? 'bottom' : 'top' })))
  }, [selectedId, setDoc])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setDoc((d) => removeItem(d, selectedId))
    setSelectedId(null)
  }, [selectedId, setDoc])

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return
    const result = duplicateItem(doc, selectedId, doc.board.gridSize * 2)
    if (!result.id) return
    setDoc(() => result.doc)
    setSelectedId(result.id)
  }, [doc, selectedId, setDoc])

  const updateBoard = useCallback(
    (patch: Partial<BoardSettings>) => setDoc((d) => ({ ...d, board: { ...d.board, ...patch } })),
    [setDoc],
  )

  const openFile = useCallback(
    async (file: File) => {
      try {
        const parsed: unknown = JSON.parse(await file.text())
        if (!isPcbDocument(parsed)) throw new Error('invalid')
        history.reset(parsed)
        setSelectedId(null)
        setDraftState(null)
        requestAnimationFrame(() => controllerRef.current?.fit())
        flash(`Opened ${parsed.board.name}`)
      } catch {
        flash('That file is not a valid Tracewright design.')
      }
    },
    [history, flash],
  )

  const handleSave = useCallback(() => {
    saveJson(doc)
    flash('Design saved to your downloads')
  }, [doc, flash])

  const handleExportSvg = useCallback(() => {
    const artwork = controllerRef.current?.getArtwork()
    if (artwork) exportSvg(artwork, doc)
  }, [doc])

  const handleExportPng = useCallback(() => {
    const artwork = controllerRef.current?.getArtwork()
    if (artwork) exportPng(artwork, doc).catch(() => flash('PNG export failed'))
  }, [doc, flash])

  const handleNew = useCallback(() => {
    const hasContent = doc.components.length + doc.traces.length + doc.texts.length > 0
    if (hasContent && !window.confirm('Start a new board? Unsaved changes to this design will be lost.')) return
    onNewBoard()
  }, [doc, onNewBoard])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && key === 's') {
        e.preventDefault()
        handleSave()
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        duplicateSelected()
        return
      }
      if (mod) return

      switch (key) {
        case 'escape':
          if (draft) setDraftState(null)
          else if (tool !== 'select') setTool('select')
          else setSelectedId(null)
          break
        case 'enter':
          finishDraft()
          break
        case 'backspace':
        case 'delete':
          e.preventDefault()
          if (draft) setDraftState((d) => (d && d.length > 1 ? d.slice(0, -1) : null))
          else deleteSelected()
          break
        case 'v':
          setTool('select')
          break
        case 'h':
          setTool('pan')
          break
        case 'w':
          setTool('trace')
          break
        case 't':
          setTool('text')
          break
        case 'o':
          pickFootprint('via')
          break
        case 'r':
          if (tool === 'place') setGhostRotation((r) => (r + 90) % 360)
          else rotateSelected()
          break
        case 'f':
          flipSelected()
          break
        case 'l':
          setActiveLayer((l) => (l === 'top' ? 'bottom' : 'top'))
          break
        case 'g':
          setShowGrid((g) => !g)
          break
        case 'a':
          setAngleSnap((a) => !a)
          break
        case '0':
          controllerRef.current?.fit()
          break
        case '=':
        case '+':
          controllerRef.current?.zoomBy(1.25)
          break
        case '-':
          controllerRef.current?.zoomBy(0.8)
          break
        case '[':
        case ']': {
          const step = key === ']' ? 1 : -1
          const idx = TRACE_WIDTHS.indexOf(traceWidth)
          const next = TRACE_WIDTHS[Math.min(TRACE_WIDTHS.length - 1, Math.max(0, (idx === -1 ? 2 : idx) + step))]
          if (selected?.kind === 'trace') updateSelected({ width: next })
          setTraceWidth(next)
          break
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    draft,
    tool,
    selected,
    traceWidth,
    undo,
    redo,
    handleSave,
    duplicateSelected,
    setTool,
    finishDraft,
    deleteSelected,
    pickFootprint,
    rotateSelected,
    flipSelected,
    updateSelected,
  ])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar
        boardName={doc.board.name}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        activeLayer={activeLayer}
        showGrid={showGrid}
        angleSnap={angleSnap}
        zoomPercent={Math.round((zoom / 6) * 100)}
        onNew={handleNew}
        onOpen={openFile}
        onSave={handleSave}
        onExportSvg={handleExportSvg}
        onExportPng={handleExportPng}
        onUndo={undo}
        onRedo={redo}
        onLayer={setActiveLayer}
        onToggleGrid={() => setShowGrid((g) => !g)}
        onToggleAngleSnap={() => setAngleSnap((a) => !a)}
        onZoomIn={() => controllerRef.current?.zoomBy(1.25)}
        onZoomOut={() => controllerRef.current?.zoomBy(0.8)}
        onFit={() => controllerRef.current?.fit()}
      />
      <div className="flex min-h-0 flex-1">
        <ToolPalette tool={tool} placeFootprint={placeFootprint} palette={paletteFor(doc)} onTool={setTool} onPick={pickFootprint} />
        <main className="relative min-w-0 flex-1">
          <PcbCanvas
            doc={doc}
            setDoc={setDoc}
            checkpoint={history.checkpoint}
            tool={tool}
            placeFootprint={placeFootprint}
            ghostRotation={ghostRotation}
            selectedId={selectedId}
            onSelect={setSelectedId}
            activeLayer={activeLayer}
            traceWidth={traceWidth}
            showGrid={showGrid}
            angleSnap={angleSnap}
            draft={draft}
            setDraft={setDraft}
            onFinishDraft={finishDraft}
            onPlace={placeComponent}
            onPlaceText={placeText}
            onCursor={setCursor}
            onZoom={setZoom}
            controllerRef={controllerRef}
          />
          {tool === 'trace' && (
            <TraceWidthPicker value={traceWidth} layer={activeLayer} onChange={setTraceWidth} />
          )}
          {message && (
            <div
              role="status"
              className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
            >
              {message}
            </div>
          )}
        </main>
        <PropertiesPanel
          doc={doc}
          selected={selected}
          onBoardChange={updateBoard}
          onItemChange={updateSelected}
          onRotate={rotateSelected}
          onFlip={flipSelected}
          onDuplicate={duplicateSelected}
          onDelete={deleteSelected}
        />
      </div>
      <StatusBar
        cursor={cursor}
        tool={tool}
        placeName={FOOTPRINTS[placeFootprint].name}
        drafting={!!draft}
        grid={doc.board.gridSize}
        activeLayer={activeLayer}
      />
    </div>
  )
}

function TraceWidthPicker({ value, layer, onChange }: { value: number; layer: Layer; onChange: (w: number) => void }) {
  return (
    <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border bg-card/95 p-1.5 pl-3 shadow-lg backdrop-blur">
      <span className="text-[11px] font-medium text-muted-foreground">
        Trace width <span className="capitalize">· {layer}</span>
      </span>
      <div role="radiogroup" aria-label="Trace width" className="flex gap-0.5">
        {TRACE_WIDTHS.map((w) => (
          <button
            key={w}
            type="button"
            role="radio"
            aria-checked={value === w}
            onClick={() => onChange(w)}
            className={
              value === w
                ? 'h-7 rounded-md bg-primary px-2 font-mono text-[11px] text-primary-foreground'
                : 'h-7 rounded-md px-2 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
            }
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}
