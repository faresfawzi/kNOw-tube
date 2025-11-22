import type { ReactNode } from 'react'
import type { Flashcard } from './types'

export function KnowledgeCardContent({ card }: { card: Flashcard }): ReactNode {
  return <>{card.knowledge_summary}</>
}

