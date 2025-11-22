import type { ReactNode } from 'react'
import type { Flashcard } from './types'

export function ClozeCardContent({ card }: { card: Flashcard }): ReactNode {
  return (
    <div>
      <p style={{ margin: 0 }}>{card.cloze_text}</p>
      {card.hint && (
        <p style={{ marginTop: '8px', opacity: 0.8 }}>Hint: {card.hint}</p>
      )}
    </div>
  )
}

