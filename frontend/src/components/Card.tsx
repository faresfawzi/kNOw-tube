interface CardProps {
  title?: string
  content?: string
}

function Card({ title = "Card Title", content = "This is some dummy text content for the card. It demonstrates the liquid glass effect with a beautiful glassmorphism design." }: CardProps) {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '20px',
        margin: '16px',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        color: 'rgba(255, 255, 255, 0.9)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(31, 38, 135, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2em', fontWeight: 600 }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: '0.95em', lineHeight: '1.6', opacity: 0.9 }}>
        {content}
      </p>
    </div>
  )
}

export default Card

