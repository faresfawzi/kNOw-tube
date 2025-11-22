import type { ReactNode } from 'react'
import type { Flashcard } from './types'

export function MultipleChoiceCardContent({ card }: { card: Flashcard }): ReactNode {
  return (
    <div>
      <p style={{ margin: '0 0 8px 0' }}>{card.question}</p>
      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0 0 8px 0' }}>
        {card.choices?.map((choice, idx) => {
          const label = String.fromCharCode(65 + idx)
          const isCorrect = card.correct_choice_index === idx
          return (
            <li
              key={`${label}-${choice}`}
              style={{ marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'baseline' }}
            >
              <span style={{ fontWeight: 600 }}>{label}.</span>
              <span>
                {choice}
                {isCorrect && (
                  <span style={{ color: '#93c5fd', marginLeft: '6px' }}>✓ correct</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      {card.explanation && (
        <p style={{ margin: 0, opacity: 0.8 }}>{card.explanation}</p>
      )}
    </div>
  )
}

