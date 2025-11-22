import { useEffect, useMemo, useState } from 'react'

import Card, {
  type Flashcard,
  type QuizQuestion,
  type WrongAnswerPayload,
  extractMultiTypeFlashcards,
  extractQaFlashcards,
  buildWrongAnswerPayload,
} from './card'
import CardList, { type CardItem as ListCardItem } from './CardList'

const API_BASE_PATH = '/api'
const MAX_WRONG_ANSWERS = 4
const MULTITYPE_CONTEXT_SECONDS = 45
const YOUTUBE_ID_REGEX = /(?:v=|\/|embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/i

export interface FlashcardBoardProps {
  videoUrl?: string,
  moveCardRight: boolean,
  setMoveCardRight: React.Dispatch<React.SetStateAction<boolean>>,
  setSendCardRight?: React.Dispatch<React.SetStateAction<Flashcard | null>>
}

export function FlashcardBoard({ videoUrl, moveCardRight, setMoveCardRight, setSendCardRight }: FlashcardBoardProps) {
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])
  const [multitypeFlashcards, setMultitypeFlashcards] = useState<Flashcard[]>([])
  const [qaFlashcards, setQaFlashcards] = useState<Flashcard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [isDeckPopoverOpen, setIsDeckPopoverOpen] = useState(false)

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

        let qaCards: Flashcard[] = []
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

  // const sectionTitleStyles = {
  //   margin: '24px 16px 8px',
  //   fontSize: '0.9rem',
  //   letterSpacing: '0.08em',
  //   textTransform: 'uppercase' as const,
  //   color: 'rgba(255, 255, 255, 0.75)',
  // }

  // const qaCardItems: ListCardItem[] = formatQAFlashcards(qaFlashcards)

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

  // Create a single card item for the multitype flashcards
  const multiTypeCardItems: ListCardItem[] = multitypeFlashcards.length > 0 ? [{
    title: 'Contextual Flashcard',
    representations: multitypeFlashcards,
    forceHighlight: true,
  }] : []

  return (
    <div style={{ padding: '24px 5%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0' }}>Flashcard Workspace</h2>
          {/* <p style={{ margin: 0, opacity: 0.7 }}>Video ID: {videoId}</p> */}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsDeckPopoverOpen(true)}
            disabled={isLoading || multitypeFlashcards.length === 0}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: 'none',
              cursor: isLoading || multitypeFlashcards.length === 0 ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
              color: '#fff',
              fontWeight: 600,
              opacity: isLoading || multitypeFlashcards.length === 0 ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            View Quiz
          </button>
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
          cards={multiTypeCardItems}
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

      {/* Deck Popover */}
      {isDeckPopoverOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
          onClick={() => setIsDeckPopoverOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: '90%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5em', fontWeight: 600 }}>Flashcard Quiz</h2>
              <button
                type="button"
                onClick={() => setIsDeckPopoverOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                Close
              </button>
            </div>
            <CardList
              cards={multiTypeCardItems}
              displayFormat="quiz"
              emptyState={(
                <Card
                  title="No flashcards in quiz"
                  content="Generate flashcards to see them in quiz view."
                />
              )}
              containerStyle={{ padding: 0 }}
            />
          </div>
        </div>
      )}
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


export default FlashcardBoard
