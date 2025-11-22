import type { Flashcard } from './types'

// Extract Flashcard from API response
export function extractMultiTypeFlashcards(payload: unknown): Flashcard[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload.filter(isMultiTypeFlashcard)
  if (typeof payload === 'object') {
    const maybeNested = (payload as Record<string, unknown>).flashcards
    if (Array.isArray(maybeNested)) {
      return maybeNested.filter(isMultiTypeFlashcard)
    }
  }
  return []
}

// Type guard for Flashcard
export function isMultiTypeFlashcard(card: unknown): card is Flashcard {
  if (!card || typeof card !== 'object') {
    return false
  }
  return typeof (card as Record<string, unknown>).card_type === 'string'
}

// Extract QA Flashcards from API response and ensure they match Flashcard interface
export function extractQaFlashcards(payload: unknown): Flashcard[] {
  if (!payload) return []

  const toFlashcard = (item: unknown): Flashcard | null => {
    if (!item || typeof item !== 'object') return null
    const typed = item as Record<string, unknown>
    if (typeof typed.question === 'string' && typeof typed.answer === 'string') {
      return {
        card_type: 'qa',
        question: typed.question,
        answer: typed.answer,
        explanation: typeof typed.explanation === 'string' ? typed.explanation : undefined
      } as Flashcard
    }
    return null
  }

  if (Array.isArray(payload)) {
    return payload.map(toFlashcard).filter((item): item is Flashcard => item !== null)
  }
  if (typeof payload === 'object') {
    const maybeNested = (payload as Record<string, unknown>).flashcards
    if (Array.isArray(maybeNested)) {
      return maybeNested.map(toFlashcard).filter((item): item is Flashcard => item !== null)
    }
  }
  return []
}

