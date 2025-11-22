import Card from './Card'

interface CardItem {
  title: string
  content: string
}

interface CardListProps {
  cards: CardItem[]
  selectedIndex: number | null
}

function CardList({ cards, selectedIndex }: CardListProps) {
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

