import Card from './Card'

interface CardItem {
  title: string
  content: string
}

interface CardListProps {
  cards: CardItem[]
}

function CardList({ cards }: CardListProps) {
  return (
    <div style={{ padding: '8px 0' }}>
      {cards.map((card, index) => (
        <Card key={index} title={card.title} content={card.content} />
      ))}
    </div>
  )
}

export default CardList

