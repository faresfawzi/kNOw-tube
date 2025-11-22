import { useEffect, useState, type ReactNode } from 'react'
import Card from './Card'

export interface CardItem {
  title: string
  content: ReactNode
  forceHighlight?: boolean
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
}: CardListProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

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

  return (
    <div style={{ padding: '8px 5%', ...containerStyle }}>
      {cards.map((card, index) => {
        const isSelected = selectedIndex === index
        const shouldHighlight = card.forceHighlight || isSelected || (enableHoverHighlight && hoverIndex === index)
        return (
          <Card
            key={`${card.title}-${index}`}
            title={card.title}
            content={card.content}
            isHighlighted={Boolean(shouldHighlight)}
            onMouseEnter={() => handleEnter(index)}
            onMouseLeave={handleLeave}
          />
        )
      })}
    </div>
  )
}

export default CardList
