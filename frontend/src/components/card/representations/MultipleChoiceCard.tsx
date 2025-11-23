import { useEffect, type ReactNode } from 'react'
import type { Flashcard } from './types'

export function MultipleChoiceCardContent({ card, isQuiz, givenAnswer }: { card: Flashcard, isQuiz?: boolean, givenAnswer?: string }): ReactNode {

  function discoFunction(overrideColor?: string) {
      const COLORS = ['blue', 'green', 'red'];

      function randomColor() {
        return COLORS[Math.floor(Math.random() * COLORS.length)];
      }

      function sendRandomColors() {
        for (let id = 1; id <= 9; id++) {
          fetch('/api/color', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, text: overrideColor ?? randomColor() })
          });
        }
      }

      // 5 waves within 500 ms
      for (let i = 0; i < 5; i++) {
        setTimeout(sendRandomColors, i * 500); // 0, 100, 200, 300, 400 ms
      }


    }

  // useEffect(() => {
  //   if (givenAnswer !== undefined && isQuiz && (parseInt(givenAnswer || '')+1 == card.correct_choice_index)) {
  //     discoFunction("green");
  //   } else {
  //     discoFunction("red");
  //   }
  // }, [givenAnswer])
  
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
                {isCorrect && !isQuiz && (
                  <span style={{ color: '#93c5fd', marginLeft: '6px' }}>✓ correct</span>
                )}
                {isQuiz && parseInt(givenAnswer || '') === idx +1 && (
                  isCorrect ? (
                    <span style={{ color: '#34d399', marginLeft: '6px' }}>✓ your answer is correct</span>
                  ) : (
                    <span style={{ color: '#f87171', marginLeft: '6px' }}>✗ your answer is incorrect</span>
                  )
                )}
                {isQuiz && givenAnswer != "" && parseInt(givenAnswer || '') !== idx +1 && isCorrect && (
                  <span style={{ color: '#34d399', marginLeft: '6px' }}>✓  this answer is correct</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
      {card.explanation  && !isQuiz&& (
        <p style={{ margin: 0, opacity: 0.8 }}>{card.explanation}</p>
      )}
    </div>
  )
}

