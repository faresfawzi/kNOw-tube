// import React from 'react'
import type { CardItem } from '../../CardList'
import type { Flashcard } from './types'
import { QACardContent } from './QACard'

// Helper function to format QA flashcards into CardItems
export function formatQAFlashcards(qaFlashcards: Flashcard[]): CardItem[] {
  return qaFlashcards.map((card, index) => ({
    title: `Reinforcement Card ${index + 1}`,
    content: <QACardContent card={card} />,
  }))
}

