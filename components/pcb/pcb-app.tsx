'use client'

import { useState } from 'react'
import { createDocument } from '@/lib/pcb/board'
import { createExampleDocument } from '@/lib/pcb/example'
import type { PcbDocument } from '@/lib/pcb/types'
import { Editor } from './editor'
import { NewBoardScreen } from './new-board-screen'

export function PcbApp() {
  const [session, setSession] = useState<{ key: number; doc: PcbDocument } | null>(null)

  if (!session) {
    return (
      <NewBoardScreen
        onCreate={(board) => setSession({ key: Date.now(), doc: createDocument(board) })}
        onExample={() => setSession({ key: Date.now(), doc: createExampleDocument() })}
      />
    )
  }

  return <Editor key={session.key} initialDoc={session.doc} onNewBoard={() => setSession(null)} />
}
