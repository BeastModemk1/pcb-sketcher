import type { PcbDocument } from './types'

const MARGIN = 2

function slug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'board'
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function buildSvg(artwork: SVGGElement, doc: PcbDocument, pxPerMm?: number) {
  const w = doc.board.width + MARGIN * 2
  const h = doc.board.height + MARGIN * 2
  const size = pxPerMm ? `width="${Math.round(w * pxPerMm)}" height="${Math.round(h * pxPerMm)}"` : `width="${w}mm" height="${h}mm"`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-MARGIN} ${-MARGIN} ${w} ${h}" ${size}>${artwork.innerHTML}</svg>`
}

export function saveJson(doc: PcbDocument) {
  download(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }), `${slug(doc.board.name)}.pcb.json`)
}

export function exportSvg(artwork: SVGGElement, doc: PcbDocument) {
  download(new Blob([buildSvg(artwork, doc)], { type: 'image/svg+xml' }), `${slug(doc.board.name)}.svg`)
}

export async function exportPng(artwork: SVGGElement, doc: PcbDocument) {
  const longest = Math.max(doc.board.width, doc.board.height) + MARGIN * 2
  const pxPerMm = Math.min(30, 4000 / longest)
  const svg = buildSvg(artwork, doc, pxPerMm)
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to render board image'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (blob) download(blob, `${slug(doc.board.name)}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}
