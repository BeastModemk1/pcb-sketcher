'use client'

import { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type RefObject } from 'react'
import { constrain45, round, snap, snapPoint } from '@/lib/pcb/board'
import { findItem, translateItem } from '@/lib/pcb/doc-ops'
import { FOOTPRINTS, padWorldPositions, rotatedBounds } from '@/lib/pcb/footprints'
import type { FootprintType, Layer, PcbDocument, PcbItem, Point, Tool } from '@/lib/pcb/types'
import { BoardArtwork, FootprintGraphic, componentTransform, paletteFor } from './artwork'

const MemoArtwork = memo(BoardArtwork)

export interface CanvasController {
  fit: () => void
  zoomBy: (factor: number) => void
  getArtwork: () => SVGGElement | null
}

interface View {
  x: number
  y: number
  scale: number
}

type Drag =
  | { type: 'pan'; startX: number; startY: number; view: View }
  | { type: 'move'; id: string; start: Point; original: PcbItem; moved: boolean }
  | { type: 'vertex'; id: string; index: number; moved: boolean }

interface PcbCanvasProps {
  doc: PcbDocument
  setDoc: (updater: (prev: PcbDocument) => PcbDocument, record?: boolean) => void
  checkpoint: () => void
  tool: Tool
  placeFootprint: FootprintType
  ghostRotation: number
  selectedId: string | null
  onSelect: (id: string | null) => void
  activeLayer: Layer
  traceWidth: number
  showGrid: boolean
  angleSnap: boolean
  draft: Point[] | null
  setDraft: (updater: (prev: Point[] | null) => Point[] | null) => void
  onFinishDraft: () => void
  onPlace: (p: Point) => void
  onPlaceText: (p: Point) => void
  onCursor: (p: Point | null) => void
  onZoom: (scale: number) => void
  controllerRef: RefObject<CanvasController | null>
}

const MIN_SCALE = 1
const MAX_SCALE = 120

export function PcbCanvas(props: PcbCanvasProps) {
  const {
    doc,
    setDoc,
    checkpoint,
    tool,
    placeFootprint,
    ghostRotation,
    selectedId,
    onSelect,
    activeLayer,
    traceWidth,
    showGrid,
    angleSnap,
    draft,
    setDraft,
    onFinishDraft,
    onPlace,
    onPlaceText,
    onCursor,
    onZoom,
    controllerRef,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const artworkRef = useRef<SVGGElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const fittedRef = useRef(false)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 6 })
  const viewRef = useRef(view)
  viewRef.current = view
  const [cursor, setCursor] = useState<Point | null>(null)
  const [shiftDown, setShiftDown] = useState(false)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)

  const grid = doc.board.gridSize
  const palette = paletteFor(doc)

  const fit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    const margin = 64
    const scale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, Math.min((w - margin * 2) / doc.board.width, (h - margin * 2) / doc.board.height)),
    )
    setView({ scale, x: (w - doc.board.width * scale) / 2, y: (h - doc.board.height * scale) / 2 })
  }, [doc.board.width, doc.board.height])

  const zoomAt = useCallback((factor: number, sx: number, sy: number) => {
    setView((v) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor))
      const k = scale / v.scale
      return { scale, x: sx - (sx - v.x) * k, y: sy - (sy - v.y) * k }
    })
  }, [])

  useImperativeHandle(
    controllerRef,
    () => ({
      fit,
      zoomBy: (factor) => zoomAt(factor, size.w / 2, size.h / 2),
      getArtwork: () => artworkRef.current,
    }),
    [fit, zoomAt, size],
  )

  useEffect(() => {
    onZoom(view.scale)
  }, [view.scale, onZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight })
      if (!fittedRef.current && el.clientWidth > 0) {
        fittedRef.current = true
        fit()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [fit])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = svg.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 1) {
        zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - rect.left, e.clientY - rect.top)
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  useEffect(() => {
    const isTyping = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(true)
      if (e.code === 'Space' && !isTyping(e.target)) {
        e.preventDefault()
        setSpaceDown(true)
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShiftDown(false)
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const snapTargets = useMemo(() => {
    const targets: Point[] = []
    for (const c of doc.components) targets.push(...padWorldPositions(c))
    for (const t of doc.traces) targets.push(...t.points)
    return targets
  }, [doc.components, doc.traces])

  const toWorld = (clientX: number, clientY: number): Point => {
    const rect = svgRef.current!.getBoundingClientRect()
    const v = viewRef.current
    return { x: (clientX - rect.left - v.x) / v.scale, y: (clientY - rect.top - v.y) / v.scale }
  }

  const resolveTracePoint = (world: Point, free: boolean): { point: Point; snapped: boolean } => {
    const threshold = Math.max(0.8, 10 / view.scale)
    let best: Point | null = null
    let bestDist = threshold
    for (const t of snapTargets) {
      const d = Math.hypot(t.x - world.x, t.y - world.y)
      if (d < bestDist) {
        best = t
        bestDist = d
      }
    }
    if (best) return { point: { x: round(best.x), y: round(best.y) }, snapped: true }
    const gridded = snapPoint(world, grid)
    const last = draft?.[draft.length - 1]
    if (last && angleSnap && !free) return { point: constrain45(last, gridded), snapped: false }
    return { point: gridded, snapped: false }
  }

  const startPan = (e: React.PointerEvent) => {
    dragRef.current = { type: 'pan', startX: e.clientX, startY: e.clientY, view: viewRef.current }
    setPanning(true)
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const world = toWorld(e.clientX, e.clientY)
    if (e.button === 1 || tool === 'pan' || spaceDown) {
      e.preventDefault()
      startPan(e)
      return
    }

    if (tool === 'trace') {
      if (e.button === 2) {
        onFinishDraft()
        return
      }
      if (e.button !== 0) return
      const { point } = resolveTracePoint(world, e.shiftKey)
      const last = draft?.[draft.length - 1]
      if (last && Math.hypot(last.x - point.x, last.y - point.y) < 1e-6) {
        onFinishDraft()
        return
      }
      setDraft((d) => (d ? [...d, point] : [point]))
      return
    }

    if (e.button !== 0) return

    if (tool === 'place') {
      onPlace(snapPoint(world, grid))
      return
    }
    if (tool === 'text') {
      onPlaceText(snapPoint(world, grid))
      return
    }

    const target = e.target as Element
    const handle = target.closest('[data-handle]')
    if (handle && selectedId) {
      dragRef.current = { type: 'vertex', id: selectedId, index: Number(handle.getAttribute('data-handle')), moved: false }
      svgRef.current?.setPointerCapture(e.pointerId)
      return
    }
    const hit = target.closest('[data-id]')
    const id = hit?.getAttribute('data-id') ?? null
    const item = findItem(doc, id)
    if (id && item) {
      onSelect(id)
      dragRef.current = { type: 'move', id, start: world, original: item, moved: false }
      svgRef.current?.setPointerCapture(e.pointerId)
      return
    }
    onSelect(null)
    startPan(e)
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const world = toWorld(e.clientX, e.clientY)
    setCursor(world)
    onCursor(world)
    const drag = dragRef.current
    if (!drag) return

    if (drag.type === 'pan') {
      setView({ ...drag.view, x: drag.view.x + e.clientX - drag.startX, y: drag.view.y + e.clientY - drag.startY })
      return
    }

    if (drag.type === 'move') {
      const dx = round(snap(world.x - drag.start.x, grid))
      const dy = round(snap(world.y - drag.start.y, grid))
      if (!drag.moved) {
        if (dx === 0 && dy === 0) return
        drag.moved = true
        checkpoint()
      }
      const moved = translateItem(drag.original, dx, dy)
      setDoc((d) => replaceItem(d, moved), false)
      return
    }

    if (drag.type === 'vertex') {
      const p = snapPoint(world, grid)
      if (!drag.moved) {
        drag.moved = true
        checkpoint()
      }
      setDoc(
        (d) => ({
          ...d,
          traces: d.traces.map((t) =>
            t.id === drag.id ? { ...t, points: t.points.map((pt, i) => (i === drag.index ? p : pt)) } : t,
          ),
        }),
        false,
      )
    }
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      svgRef.current?.releasePointerCapture(e.pointerId)
      dragRef.current = null
      setPanning(false)
    }
  }

  const handlePointerLeave = () => {
    if (!dragRef.current) {
      setCursor(null)
      onCursor(null)
    }
  }

  const selected = findItem(doc, selectedId)
  const tracePreview = tool === 'trace' && cursor ? resolveTracePoint(cursor, shiftDown) : null
  const ghostPoint = (tool === 'place' || tool === 'text') && cursor ? snapPoint(cursor, grid) : null

  let displayGrid = grid
  while (displayGrid * view.scale < 8) displayGrid *= 2
  const dot = 1.1 / view.scale
  const px = (n: number) => n / view.scale

  const cursorClass = panning
    ? 'cursor-grabbing'
    : spaceDown || tool === 'pan'
      ? 'cursor-grab'
      : tool === 'select'
        ? 'cursor-default'
        : 'cursor-crosshair'

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#0b0d10]">
      <svg
        ref={svgRef}
        className={`block h-full w-full touch-none select-none ${cursorClass}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        role="application"
        aria-label={`PCB editor canvas for ${doc.board.name}`}
      >
        <defs>
          <pattern
            id="pcb-grid"
            width={displayGrid}
            height={displayGrid}
            x={-displayGrid / 2}
            y={-displayGrid / 2}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={displayGrid / 2} cy={displayGrid / 2} r={dot} fill="#ffffff" />
          </pattern>
        </defs>
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <g ref={artworkRef}>
            <MemoArtwork doc={doc} activeLayer={activeLayer} />
          </g>

          <g pointerEvents="none">
            {showGrid && (
              <rect
                x={-200}
                y={-200}
                width={doc.board.width + 400}
                height={doc.board.height + 400}
                fill="url(#pcb-grid)"
                opacity={0.14}
              />
            )}
            <text
              x={doc.board.width / 2}
              y={doc.board.height + px(22)}
              fontSize={px(11)}
              fill="#8b929c"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {`${doc.board.width} × ${doc.board.height} mm`}
            </text>
          </g>

          {selected && <SelectionOverlay item={selected} scale={view.scale} />}

          {tool === 'trace' && draft && draft.length > 0 && tracePreview && (
            <g pointerEvents="none">
              <path
                d={[...draft, tracePreview.point].map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                stroke={palette.copper}
                strokeOpacity={0.9}
                strokeWidth={traceWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={[...draft, tracePreview.point].map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                stroke="#f0b55a"
                strokeWidth={px(1)}
                strokeDasharray={`${px(4)} ${px(3)}`}
                fill="none"
              />
            </g>
          )}

          {tracePreview && (
            <g pointerEvents="none">
              <line
                x1={tracePreview.point.x - px(8)}
                y1={tracePreview.point.y}
                x2={tracePreview.point.x + px(8)}
                y2={tracePreview.point.y}
                stroke="#f0b55a"
                strokeWidth={px(1)}
              />
              <line
                x1={tracePreview.point.x}
                y1={tracePreview.point.y - px(8)}
                x2={tracePreview.point.x}
                y2={tracePreview.point.y + px(8)}
                stroke="#f0b55a"
                strokeWidth={px(1)}
              />
              {tracePreview.snapped && (
                <circle cx={tracePreview.point.x} cy={tracePreview.point.y} r={px(7)} fill="none" stroke="#f0b55a" strokeWidth={px(1.5)} />
              )}
            </g>
          )}

          {tool === 'place' && ghostPoint && (
            <g
              pointerEvents="none"
              opacity={0.65}
              transform={componentTransform({ x: ghostPoint.x, y: ghostPoint.y, rotation: ghostRotation, layer: activeLayer })}
            >
              <FootprintGraphic def={FOOTPRINTS[placeFootprint]} palette={palette} />
            </g>
          )}

          {tool === 'text' && ghostPoint && (
            <text
              x={ghostPoint.x}
              y={ghostPoint.y}
              fontSize={1.6}
              fontFamily="ui-monospace, monospace"
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="central"
              fill={palette.silk}
              opacity={0.6}
              pointerEvents="none"
            >
              TEXT
            </text>
          )}
        </g>
      </svg>
    </div>
  )
}

function replaceItem(doc: PcbDocument, item: PcbItem): PcbDocument {
  if (item.kind === 'component') return { ...doc, components: doc.components.map((c) => (c.id === item.id ? item : c)) }
  if (item.kind === 'trace') return { ...doc, traces: doc.traces.map((t) => (t.id === item.id ? item : t)) }
  return { ...doc, texts: doc.texts.map((t) => (t.id === item.id ? item : t)) }
}

function SelectionOverlay({ item, scale }: { item: PcbItem; scale: number }) {
  const px = (n: number) => n / scale
  const accent = '#f0b55a'

  if (item.kind === 'trace') {
    const d = item.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    return (
      <g>
        <path
          d={d}
          stroke={accent}
          strokeWidth={item.width + px(3)}
          strokeOpacity={0.35}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
        {item.points.map((p, i) => (
          <rect
            key={i}
            data-handle={i}
            x={p.x - px(4.5)}
            y={p.y - px(4.5)}
            width={px(9)}
            height={px(9)}
            fill="#0b0d10"
            stroke={accent}
            strokeWidth={px(1.5)}
            className="cursor-move"
          />
        ))}
      </g>
    )
  }

  if (item.kind === 'component') {
    const { w, h } = rotatedBounds(item)
    const pad = px(4)
    return (
      <rect
        x={item.x - w / 2 - pad}
        y={item.y - h / 2 - pad}
        width={w + pad * 2}
        height={h + pad * 2}
        fill={accent}
        fillOpacity={0.06}
        stroke={accent}
        strokeWidth={px(1.25)}
        strokeDasharray={`${px(5)} ${px(3)}`}
        pointerEvents="none"
      />
    )
  }

  const w = Math.max(1, item.text.length) * item.size * 0.62
  const h = item.size * 1.2
  const pad = px(4)
  return (
    <rect
      transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
      x={-w / 2 - pad}
      y={-h / 2 - pad}
      width={w + pad * 2}
      height={h + pad * 2}
      fill={accent}
      fillOpacity={0.06}
      stroke={accent}
      strokeWidth={px(1.25)}
      strokeDasharray={`${px(5)} ${px(3)}`}
      pointerEvents="none"
    />
  )
}
