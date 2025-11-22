import { useEffect, useMemo, useState } from 'react'

import Card from './Card'
import CardList, { type CardItem as ListCardItem } from './CardList'

type MultiTypeFlashcard =
  | {
      card_type: 'knowledge'
      title: string
      knowledge_summary: string
    }
  | {
      card_type: 'multiple_choice'
      question: string
      choices: string[]
      correct_choice_index: number
      explanation?: string
    }
  | {
      card_type: 'cloze'
      cloze_text: string
      hint?: string
    }
  | {
      card_type: 'qa'
      question: string
      answer: string
      explanation?: string
    }

interface QuizQuestion {
  question: string
  options?: Record<string, string>
  correct_answer?: string
}

export interface QAFlashcard {
  question: string
  answer: string
  explanation?: string
}

interface WrongAnswerPayload {
  question: string
  options: Record<string, string>
  correct_answer?: string
  student_wrong_answer: string
}

const API_BASE_PATH = '/api'
const MAX_WRONG_ANSWERS = 4
const MULTITYPE_CONTEXT_SECONDS = 45
const YOUTUBE_ID_REGEX = /(?:v=|\/|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i

export interface FlashcardBoardProps {
  videoUrl?: string,
  moveCardRight: boolean,
  setMoveCardRight: React.Dispatch<React.SetStateAction<boolean>>,
  setSendCardRight?: React.Dispatch<React.SetStateAction<QAFlashcard | null>>
}

export function FlashcardBoard({ videoUrl, moveCardRight, setMoveCardRight, setSendCardRight }: FlashcardBoardProps) {
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])
  const [multitypeFlashcards, setMultitypeFlashcards] = useState<MultiTypeFlashcard[]>([])
  const [qaFlashcards, setQaFlashcards] = useState<QAFlashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [currentCardView, setCurrentCardView] = useState(0)
  useEffect(() => {
    if (currentCardView >= multitypeFlashcards.length) {
      setCurrentCardView(0)
    }
  }, [currentCardView, multitypeFlashcards.length])

  useEffect(() => {
    if (!videoId) {
      setMultitypeFlashcards([])
      setQaFlashcards([])
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    const loadFlashcards = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const multiPromise = fetch(`${API_BASE_PATH}/generate_multitype_flashcards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_id: videoId,
            time_stamp: 0,
            context_seconds: MULTITYPE_CONTEXT_SECONDS,
          }),
        })

        const quizPromise = fetch(`${API_BASE_PATH}/quiz?video_id=${encodeURIComponent(videoId)}&difficulty_level=medium`)

        const [multiResponse, quizResponse] = await Promise.all([multiPromise, quizPromise])

        if (!multiResponse.ok) {
          throw new Error('Failed to generate multi-type flashcards')
        }
        if (!quizResponse.ok) {
          throw new Error('Failed to load quiz questions')
        }

        const multiJson = await multiResponse.json()
        const quizJson = await quizResponse.json()

        const multiCards = extractMultiTypeFlashcards(multiJson?.flashcards ?? multiJson)
        const quizQuestions: QuizQuestion[] = Array.isArray(quizJson?.quiz) ? quizJson.quiz : []

        const wrongAnswersPayload = quizQuestions
          .slice(0, MAX_WRONG_ANSWERS)
          .map(buildWrongAnswerPayload)
          .filter((entry): entry is WrongAnswerPayload => entry !== null)

        let qaCards: QAFlashcard[] = []
        if (wrongAnswersPayload.length) {
          const qaResponse = await fetch(`${API_BASE_PATH}/generate_qa_flashcards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quiz_questions_with_wrong_answers: wrongAnswersPayload,
              video_id: videoId,
            }),
          })

          if (!qaResponse.ok) {
            throw new Error('Failed to generate QA flashcards')
          }

          const qaJson = await qaResponse.json()
          qaCards = extractQaFlashcards(qaJson?.flashcards ?? qaJson)
        }

        if (!cancelled) {
          setMultitypeFlashcards(multiCards)
          setQaFlashcards(qaCards)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load flashcards')
          setMultitypeFlashcards([])
          setQaFlashcards([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadFlashcards()
    return () => { cancelled = true }
  }, [videoId, refreshIndex])

  const refreshFlashcards = () => setRefreshIndex((idx) => idx + 1)

  const sectionTitleStyles = {
    margin: '24px 16px 8px',
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255, 255, 255, 0.75)',
  }

  const multitypeCardItems: ListCardItem[] = multitypeFlashcards.map(formatMultiTypeCard)
  const qaCardItems: ListCardItem[] = qaFlashcards.map((card, index) => ({
    title: `Reinforcement Card ${index + 1}`,
    content: (
      <div>
        <p style={{ margin: '0 0 6px 0' }}><strong>Question:</strong> {card.question}</p>
        <p style={{ margin: 0 }}><strong>Answer:</strong> {card.answer}</p>
        {card.explanation && (
          <p style={{ marginTop: '6px', opacity: 0.8 }}>{card.explanation}</p>
        )}
      </div>
    ),
  }))

  if (!videoId) {
    return (
      <div style={{ padding: '32px 5%' }}>
        <Card
          title="Flashcards"
          content="Add ?v=YOUTUBE_VIDEO_ID to the URL or interact with the player to generate AI flashcards for that video."
          isHighlighted
        />
      </div>
    )
  }

<<<<<<< HEAD
  useEffect(() => {
    console.log("moveCardRight changed:", moveCardRight);
    console.log("Current qaFlashcards:", qaFlashcards);
    if (moveCardRight && qaFlashcards.length > 0) {
      const selectedCard = qaFlashcards[0]
      console.log('Preparing to send card right:', selectedCard)
      // setSendCardRight && setSendCardRight(() => selectedCard)
      // setMoveCardRight(false)
    }
  }, [moveCardRight, qaFlashcards, setMoveCardRight, setSendCardRight])
=======
  const mappingIndexToType: Record<number, string> = {
    0: 'Knowledge Summary',
    1: 'Multiple Choice Challenge',
    2: 'Cloze Recall Card',
    3: 'Q&A Flashcard',
  }

  const multitypeOptions = multitypeFlashcards.map((_, index) => ({
    label: mappingIndexToType[index] || `Card ${index + 1}`,
    value: index,
  }))

  const fallbackMultitypeCard: ListCardItem = {
    title: 'No flashcards available',
    content: 'There are no multitype flashcards to display at this time.',
  }

  const selectedMultitypeCard = multitypeCardItems[currentCardView] ?? fallbackMultitypeCard
  const multiTypeCardWithPicker: ListCardItem = {
    ...selectedMultitypeCard,
    title: selectedMultitypeCard.title,
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {multitypeFlashcards.length > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em' }}>Card view</span>
              <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Choose the flashcard style for this card</span>
            </div> */}
            <div>&nbsp;</div>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <select
                value={currentCardView}
                onChange={(e) => setCurrentCardView(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  appearance: 'none' as const,
                  WebkitAppearance: 'none',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer',
                }}
              >
                {multitypeOptions.map((option) => (
                  <option key={option.value} value={option.value} style={{ color: '#000' }}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.8rem',
                }}
              >
                ▼
              </span>
            </div>
          </div>
        )}
        {selectedMultitypeCard.content}
      </div>
    ),
  }
>>>>>>> 62876f3 (Change)

  return (
    <div style={{ padding: '24px 5%' }}>
      {JSON.stringify(moveCardRight)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Flashcard Workspace</h2>
          {/* <p style={{ margin: 0, opacity: 0.7 }}>Video ID: {videoId}</p> */}
        </div>
        <button
          type="button"
          onClick={refreshFlashcards}
          disabled={isLoading}
          style={{
            padding: '10px 16px',
            borderRadius: '999px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontWeight: 600,
            opacity: isLoading ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {isLoading ? 'Generating flashcards...' : 'Regenerate flashcards'}
        </button>
      </div>

      {error && !isLoading && <Card title="Unable to load flashcards" content={error} />}
          
      {isLoading && (
        <Card
          title="Working on it"
          content="We are generating both multi-type and Q&A flashcards from your video."
          isHighlighted
        />
      )}

      <section>
        {/* <h3 style={sectionTitleStyles}>Multitype Flashcards</h3> */}
        <CardList
          cards={[multiTypeCardWithPicker]}
          emptyState={(
            <Card
              title="No flashcards yet"
              content="Click the regenerate button above to fetch contextual flashcards from the transcript."
            />
          )}
          containerStyle={{ padding: 0 }}
        />
      </section>

      {/* <section>
        <h3 style={sectionTitleStyles}>Q&A Flashcards</h3>
        <CardList
          cards={qaCardItems}
          emptyState={(
            <Card
              title="No QA flashcards"
              content="Once quiz questions return, use the regenerate button to populate this section."
            />
          )}
          containerStyle={{ padding: 0 }}
        />
      </section> */}
    </div>
  )
}

function extractVideoId(videoUrl?: string): string | undefined {
  if (!videoUrl) return undefined
  try {
    const url = new URL(videoUrl)
    const fromQuery = url.searchParams.get('v')
    if (fromQuery) return fromQuery
    if (url.hostname.includes('youtu.be')) {
      const trimmed = url.pathname.replace('/', '')
      return trimmed || undefined
    }
  } catch {
    const match = videoUrl.match(YOUTUBE_ID_REGEX)
    if (match && match[1]) {
      return match[1]
    }
  }
  return undefined
}

function extractMultiTypeFlashcards(payload: unknown): MultiTypeFlashcard[] {
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

function extractQaFlashcards(payload: unknown): QAFlashcard[] {
  if (!payload) return []
  if (Array.isArray(payload)) {
    return payload.filter((item): item is QAFlashcard => {
      if (!item || typeof item !== 'object') return false
      const typed = item as Record<string, unknown>
      return typeof typed.question === 'string' && typeof typed.answer === 'string'
    })
  }
  if (typeof payload === 'object') {
    const maybeNested = (payload as Record<string, unknown>).flashcards
    if (Array.isArray(maybeNested)) {
      return extractQaFlashcards(maybeNested)
    }
  }
  return []
}

function isMultiTypeFlashcard(card: unknown): card is MultiTypeFlashcard {
  if (!card || typeof card !== 'object') {
    return false
  }
  return typeof (card as Record<string, unknown>).card_type === 'string'
}

function pickWrongAnswerKey(question: QuizQuestion): string | null {
  const options = question.options ?? {}
  const optionKeys = Object.keys(options)
  if (!optionKeys.length) {
    return null
  }
  const wrongOptions = question.correct_answer
    ? optionKeys.filter((key) => key !== question.correct_answer)
    : optionKeys
  const pool = wrongOptions.length ? wrongOptions : optionKeys
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex] ?? null
}

function buildWrongAnswerPayload(question: QuizQuestion): WrongAnswerPayload | null {
  if (typeof question.question !== 'string' || !question.options) {
    return null
  }
  const wrongAnswerKey = pickWrongAnswerKey(question)
  if (!wrongAnswerKey) {
    return null
  }
  return {
    question: question.question,
    options: question.options,
    correct_answer: question.correct_answer,
    student_wrong_answer: wrongAnswerKey,
  }
}

function formatMultiTypeCard(card: MultiTypeFlashcard): ListCardItem {
  if (card.card_type === 'knowledge') {
    return {
      title: card.title,
      content: card.knowledge_summary,
      forceHighlight: true,
    }
  }

  if (card.card_type === 'multiple_choice') {
    const content = (
      <div>
        <p style={{ margin: '0 0 8px 0' }}>{card.question}</p>
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: '0 0 8px 0' }}>
          {card.choices.map((choice, idx) => {
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
    return {
      title: 'Multiple Choice Challenge',
      content,
    }
  }

  if (card.card_type === 'cloze') {
    return {
      title: 'Cloze Recall Card',
      content: (
        <div>
          <p style={{ margin: 0 }}>{card.cloze_text}</p>
          {card.hint && (
            <p style={{ marginTop: '8px', opacity: 0.8 }}>Hint: {card.hint}</p>
          )}
        </div>
      ),
    }
  }

  return {
    title: 'Q&A Flashcard',
    content: (
      <div>
        <p style={{ margin: '0 0 6px 0' }}><strong>Question:</strong> {card.question}</p>
        <p style={{ margin: 0 }}><strong>Answer:</strong> {card.answer}</p>
        {card.explanation && (
          <p style={{ marginTop: '6px', opacity: 0.8 }}>{card.explanation}</p>
        )}
      </div>
    ),
  }
}

export default FlashcardBoard
