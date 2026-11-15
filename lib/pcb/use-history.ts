'use client'

import { useCallback, useState } from 'react'

const LIMIT = 150

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

export function useHistory<T>(initial: T) {
  const [state, setState] = useState<HistoryState<T>>({ past: [], present: initial, future: [] })

  const set = useCallback((updater: (prev: T) => T, record = true) => {
    setState((s) => {
      const next = updater(s.present)
      if (next === s.present) return s
      if (!record) return { ...s, present: next }
      return { past: [...s.past.slice(-LIMIT), s.present], present: next, future: [] }
    })
  }, [])

  const checkpoint = useCallback(() => {
    setState((s) => ({ past: [...s.past.slice(-LIMIT), s.present], present: s.present, future: [] }))
  }, [])

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s
      const previous = s.past[s.past.length - 1]
      return { past: s.past.slice(0, -1), present: previous, future: [s.present, ...s.future] }
    })
  }, [])

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s
      const [next, ...rest] = s.future
      return { past: [...s.past, s.present], present: next, future: rest }
    })
  }, [])

  const reset = useCallback((value: T) => {
    setState({ past: [], present: value, future: [] })
  }, [])

  return {
    value: state.present,
    set,
    checkpoint,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
