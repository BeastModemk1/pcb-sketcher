import { newId, round } from './board'
import type { PcbDocument, PcbItem } from './types'

export function findItem(doc: PcbDocument, id: string | null): PcbItem | null {
  if (!id) return null
  return (
    doc.components.find((c) => c.id === id) ??
    doc.traces.find((t) => t.id === id) ??
    doc.texts.find((t) => t.id === id) ??
    null
  )
}

export function updateItem(doc: PcbDocument, id: string, fn: (item: PcbItem) => PcbItem): PcbDocument {
  if (doc.components.some((c) => c.id === id)) {
    return { ...doc, components: doc.components.map((c) => (c.id === id ? (fn(c) as typeof c) : c)) }
  }
  if (doc.traces.some((t) => t.id === id)) {
    return { ...doc, traces: doc.traces.map((t) => (t.id === id ? (fn(t) as typeof t) : t)) }
  }
  if (doc.texts.some((t) => t.id === id)) {
    return { ...doc, texts: doc.texts.map((t) => (t.id === id ? (fn(t) as typeof t) : t)) }
  }
  return doc
}

export function removeItem(doc: PcbDocument, id: string): PcbDocument {
  return {
    ...doc,
    components: doc.components.filter((c) => c.id !== id),
    traces: doc.traces.filter((t) => t.id !== id),
    texts: doc.texts.filter((t) => t.id !== id),
  }
}

export function translateItem<T extends PcbItem>(item: T, dx: number, dy: number): T {
  if (item.kind === 'trace') {
    return { ...item, points: item.points.map((p) => ({ x: round(p.x + dx), y: round(p.y + dy) })) }
  }
  return { ...item, x: round(item.x + dx), y: round(item.y + dy) }
}

export function duplicateItem(doc: PcbDocument, id: string, offset: number): { doc: PcbDocument; id: string | null } {
  const item = findItem(doc, id)
  if (!item) return { doc, id: null }
  const copy = { ...translateItem(item, offset, offset), id: newId() }
  if (copy.kind === 'component') return { doc: { ...doc, components: [...doc.components, copy] }, id: copy.id }
  if (copy.kind === 'trace') return { doc: { ...doc, traces: [...doc.traces, copy] }, id: copy.id }
  return { doc: { ...doc, texts: [...doc.texts, copy] }, id: copy.id }
}
