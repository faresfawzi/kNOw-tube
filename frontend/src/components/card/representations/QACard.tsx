import type { ReactNode } from 'react'
import type { Flashcard } from './types'

export function QACardContent({ card }: { card: Flashcard }): ReactNode {
  return (
    <div>
      <p style={{ margin: '0 0 6px 0' }}><strong>Question:</strong> {card.question}</p>
      <p style={{ margin: 0 }}><strong>Answer:</strong> {card.answer}</p>
      {card.explanation && (
        <p style={{ marginTop: '6px', opacity: 0.8 }}>{card.explanation}</p>
      )}
    </div>
  )
}

