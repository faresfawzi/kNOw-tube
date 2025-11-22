import Card from './Card'
import React from 'react'

interface CardItem {
  title: string
  content: string
}

interface CardListProps {
  cards: CardItem[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  currentSmallWheelOffset: number
  active?: boolean
}

function CardList({ cards, selectedIndex, setSelectedIndex, currentSmallWheelOffset, active }: CardListProps) {
  React.useEffect(() => {
    if (!active) return;
    if (currentSmallWheelOffset !== 0) {
      if (currentSmallWheelOffset > 0) {
        setSelectedIndex(selectedIndex == 0 ? 0 : selectedIndex - 1)
      } else {
        setSelectedIndex(selectedIndex == cards.length - 1 ? cards.length - 1 : selectedIndex + 1)
      }
    }
  }, [currentSmallWheelOffset, setSelectedIndex])




  return (
    <div style={{ padding: '8px 5%' }}>
      {cards.map((card, index) => (
        <Card 
          key={index} 
          title={card.title} 
          content={card.content}
          isHighlighted={selectedIndex === index}
        />
      ))}
    </div>
  )
}

export default CardList

