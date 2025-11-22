export interface Flashcard {
  // Common
  card_type: 'knowledge' | 'multiple_choice' | 'cloze' | 'qa'

  // Knowledge
  title?: string
  knowledge_summary?: string

  // Multiple Choice / QA
  question?: string
  explanation?: string

  // Multiple Choice
  choices?: string[]
  correct_choice_index?: number

  // Cloze
  cloze_text?: string
  hint?: string

  // QA
  answer?: string
}

