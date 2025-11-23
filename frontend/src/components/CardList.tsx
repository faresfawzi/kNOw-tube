import { useEffect, useState, type ReactNode } from 'react'
import Card, { type Flashcard } from './card'

export interface CardItem {
  title: string
  content?: ReactNode
  representations?: Flashcard[]
  forceHighlight?: boolean
  hideTitle?: boolean
}

interface CardListProps {
  cards: CardItem[]
  emptyState?: ReactNode
  enableHoverHighlight?: boolean
  containerStyle?: React.CSSProperties
  selectedIndex?: number | null
  setSelectedIndex?: (index: number | null) => void
  currentSmallWheelOffset?: number
  active?: boolean
  displayFormat?: 'list' | 'quiz'
  isDeckPopoverOpen?: boolean
}

function CardList({
  cards,
  emptyState,
  enableHoverHighlight = true,
  containerStyle,
  selectedIndex = null,
  setSelectedIndex,
  currentSmallWheelOffset = 0,
  active = false,
  displayFormat = 'list',
  isDeckPopoverOpen,
  givenAnswer,
  setGivenAnswer,
}: CardListProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [quizIndex, setQuizIndex] = useState(0)

  useEffect(() => {
    if (!active || !setSelectedIndex || !cards.length) return
    if (currentSmallWheelOffset === 0) return

    if (selectedIndex === null) {
      setSelectedIndex(currentSmallWheelOffset > 0 ? 0 : cards.length - 1)
      return
    }

    if (currentSmallWheelOffset > 0) {
      setSelectedIndex(Math.max(0, selectedIndex - 1))
    } else {
      setSelectedIndex(Math.min(cards.length - 1, selectedIndex + 1))
    }
  }, [active, cards.length, currentSmallWheelOffset, selectedIndex, setSelectedIndex])

  if (!cards.length && emptyState) {
    return <div style={{ padding: '8px 5%', ...containerStyle }}>{emptyState}</div>
  }

  const handleEnter = (index: number) => {
    if (!enableHoverHighlight) return
    setHoverIndex(index)
  }

  const handleLeave = () => {
    if (!enableHoverHighlight) return
    setHoverIndex(null)
  }

  const isQuizFormat = displayFormat === 'quiz'

  if (isQuizFormat) {
    const currentCard = cards[quizIndex]
    const hasPrevious = quizIndex > 0
    const hasNext = quizIndex < cards.length - 1

    return (
      <div
        style={{
          padding: '8px 5%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          ...containerStyle,
        }}
      >
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <Card
            title={currentCard.title}
            content={currentCard.content}
            representations={currentCard.representations}
            isHighlighted={true}
            hideTitle={currentCard.hideTitle}
            isDeckPopoverOpen={isDeckPopoverOpen}
            givenAnswer={givenAnswer}
              setGivenAnswer={setGivenAnswer}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => { setQuizIndex(Math.max(0, quizIndex - 1)); setGivenAnswer(''); }}
            disabled={!hasPrevious}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: hasPrevious ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: hasPrevious ? '#fff' : 'rgba(255, 255, 255, 0.3)',
              cursor: hasPrevious ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Previous
          </button>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
            {quizIndex + 1} / {cards.length}
          </span>
          <button
            type="button"
            onClick={() => { setQuizIndex(Math.min(cards.length - 1, quizIndex + 1)); setGivenAnswer(''); }}
            disabled={!hasNext}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: hasNext ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: hasNext ? '#fff' : 'rgba(255, 255, 255, 0.3)',
              cursor: hasNext ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      
      style={{
        padding: '8px 5%',
        ...containerStyle,
      }}
    >
      {cards.map((card, index) => {
        const isSelected = selectedIndex === index
        const shouldHighlight = card.forceHighlight || isSelected || (enableHoverHighlight && hoverIndex === index)

        return (
          <div
            className="card-list-container"
            key={`${card.title}-${index}`}
          >
            <Card
              title={card.title}
              content={card.content}
              representations={card.representations}
              isHighlighted={Boolean(shouldHighlight)}
              hideTitle={card.hideTitle}
              onMouseEnter={() => handleEnter(index)}
              onMouseLeave={handleLeave}
              givenAnswer={givenAnswer}
              setGivenAnswer={setGivenAnswer}
            />
          </div>
        )
      })}
    </div>
  )
}

export default CardList
