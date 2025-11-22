import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  content?: ReactNode
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function Card({
  title = 'Card Title',
  content = 'This is placeholder content for the card.',
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
}: CardProps) {
  const contentStyles = {
    margin: 0,
    fontSize: '0.95em',
    lineHeight: '1.6',
    opacity: 0.9,
    whiteSpace: 'pre-line' as const,
  }

  const body = typeof content === 'string'
    ? <p style={contentStyles}>{content}</p>
    : <div style={contentStyles}>{content}</div>

  return (
    <div
      className="card"
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
      <h3 className="title" style={{ margin: '0 0 12px 0', fontSize: '1.2em', fontWeight: 600 }}>{title}</h3>
      {body}
    </div>
  )
}

export default Card
