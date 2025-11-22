import { useState } from 'react'
import Card from './Card'

interface CardItem {
  title: string
  content: string
}

interface CardListProps {
  cards: CardItem[]
}

function CardList({ cards }: CardListProps) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  return (
    <div style={{ padding: '8px 5%' }}>
      {cards.map((card, index) => (
        <Card 
          key={index} 
          title={card.title} 
          content={card.content}
          isHighlighted={highlightedIndex === index}
        />
      ))}
    </div>
  )
}

export default CardList

