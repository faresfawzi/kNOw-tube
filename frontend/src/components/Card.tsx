import { ReactNode, useEffect, useMemo, useState } from 'react'

interface CardProps {
  title?: string
  content?: ReactNode
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

type MultiTypeFlashcard =
  | {
      card_type: 'knowledge'
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

interface QAFlashcard {
  question: string
  answer: string
  explanation?: string
}

const API_BASE_PATH = '/api'
const YOUTUBE_ID_REGEX = /(?:v=|\/|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i

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

function Card({ 
  title = "Card Title", 
  content = "This is some dummy text content for the card. It demonstrates the liquid glass effect with a beautiful glassmorphism design.",
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave
}: CardProps) {
  const contentStyles = {
    margin: 0,
    fontSize: '0.95em',
    lineHeight: '1.6',
    opacity: 0.9,
    whiteSpace: 'pre-line' as const,
  }

  const body = typeof content === 'string'
    ? (<p style={contentStyles}>{content}</p>)
    : (<div style={contentStyles}>{content}</div>)

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: isHighlighted 
          ? '2px solid rgba(147, 197, 253, 0.6)' 
          : '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px',
        margin: '16px',
        boxShadow: isHighlighted
          ? '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 20px rgba(147, 197, 253, 0.4), 0 0 40px rgba(147, 197, 253, 0.2), 0 0 60px rgba(147, 197, 253, 0.1), inset 0 0 20px rgba(147, 197, 253, 0.1)'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        color: 'rgba(255, 255, 255, 0.9)',
        transition: 'transform 0.2s ease, box-shadow 0.3s ease, border 0.3s ease',
        position: 'relative' as const,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        if (!isHighlighted) {
          e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(31, 38, 135, 0.5)'
        }
        onMouseEnter?.()
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        if (!isHighlighted) {
          e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
        }
        onMouseLeave?.()
      }}
    >
      {isHighlighted && (
        <div
          style={{
            position: 'absolute' as const,
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            borderRadius: '16px',
            background: 'linear-gradient(45deg, rgba(147, 197, 253, 0.3), rgba(196, 181, 253, 0.3), rgba(147, 197, 253, 0.3))',
            backgroundSize: '200% 200%',
            animation: 'liquidGlow 3s ease infinite',
            zIndex: -1,
            filter: 'blur(8px)',
            pointerEvents: 'none' as const,
          }}
        />
      )}
      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2em', fontWeight: 600 }}>
        {title}
      </h3>
      {body}
    </div>
  )
}

const MAX_WRONG_ANSWERS = 4
const MULTITYPE_CONTEXT_SECONDS = 45

function extractMultiTypeFlashcards(payload: unknown): MultiTypeFlashcard[] {
  if (!payload) {
    return []
  }

  if (Array.isArray(payload)) {
    return payload.filter(isMultiTypeFlashcard)
  }

  if (typeof payload === 'object') {
    const maybeNested = (payload as Record<string, unknown>).flashcards
    if (Array.isArray(maybeNested)) {
      return maybeNested.filter(isMultiTypeFlashcard)
    }
  }

  return []
}

function isMultiTypeFlashcard(card: unknown): card is MultiTypeFlashcard {
  if (!card || typeof card !== 'object') {
    return false
  }
  const typed = card as Record<string, unknown>
  return typeof typed.card_type === 'string'
}

function extractQaFlashcards(payload: unknown): QAFlashcard[] {
  if (!payload) {
    return []
  }

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

interface WrongAnswerPayload {
  question: string
  options: Record<string, string>
  correct_answer?: string
  student_wrong_answer: string
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

function formatMultiTypeCard(card: MultiTypeFlashcard): { title: string; content: ReactNode } {
  if (card.card_type === 'knowledge') {
    return {
      title: 'Knowledge Summary',
      content: card.knowledge_summary,
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
                    <span style={{ color: '#93c5fd', marginLeft: '6px' }}>
                      ✓ correct
                    </span>
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

export function FlashcardBoard({ videoUrl }: { videoUrl?: string }) {
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])
  const [multitypeFlashcards, setMultitypeFlashcards] = useState<MultiTypeFlashcard[]>([])
  const [qaFlashcards, setQaFlashcards] = useState<QAFlashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!videoId) {
      setIsLoading(false)
      setError(null)
      setMultitypeFlashcards([])
      setQaFlashcards([])
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

    return () => {
      cancelled = true
    }
  }, [videoId, refreshIndex])

  const refreshFlashcards = () => setRefreshIndex((idx) => idx + 1)

  const sectionTitleStyles = {
    margin: '24px 16px 8px',
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255, 255, 255, 0.75)',
  }

  if (!videoId) {
    return (
      <div style={{ padding: '32px 5%' }}>
        <Card
          title="Flashcards"
          content="Add ?v=YOUTUBE_VIDEO_ID to the URL to generate AI flashcards for that video."
          isHighlighted
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 5%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Flashcard Workspace</h2>
          <p style={{ margin: 0, opacity: 0.7 }}>Video ID: {videoId}</p>
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

      {error && !isLoading && (
        <Card title="Unable to load flashcards" content={error} />
      )}

      {isLoading && (
        <Card
          title="Working on it"
          content="We are generating both multi-type and Q&A flashcards from your video."
          isHighlighted
        />
      )}

      <section>
        <h3 style={sectionTitleStyles}>Multitype Flashcards</h3>
        {multitypeFlashcards.length === 0 && !isLoading && !error && (
          <Card
            title="No flashcards yet"
            content="Click the regenerate button above to fetch contextual flashcards from the transcript."
          />
        )}
        {multitypeFlashcards.map((card, index) => {
          const { title, content } = formatMultiTypeCard(card)
          return (
            <Card
              key={`multitype-${card.card_type}-${index}`}
              title={title}
              content={content}
              isHighlighted={card.card_type === 'knowledge'}
            />
          )
        })}
      </section>

      <section>
        <h3 style={sectionTitleStyles}>Q&A Flashcards</h3>
        {qaFlashcards.length === 0 && !isLoading && !error && (
          <Card
            title="No QA flashcards"
            content="We create these after generating quiz questions. Once the quiz service returns data, use the regenerate button to populate this section."
          />
        )}
        {qaFlashcards.map((card, index) => (
          <Card
            key={`qa-${index}`}
            title={`Reinforcement Card ${index + 1}`}
            content={(
              <div>
                <p style={{ margin: '0 0 6px 0' }}><strong>Question:</strong> {card.question}</p>
                <p style={{ margin: 0 }}><strong>Answer:</strong> {card.answer}</p>
                {card.explanation && (
                  <p style={{ marginTop: '6px', opacity: 0.8 }}>{card.explanation}</p>
                )}
              </div>
            )}
          />
        ))}
      </section>
    </div>
  )
}

export default Card
