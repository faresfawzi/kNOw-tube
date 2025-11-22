import { type ReactNode, useState } from 'react'
import {
  KnowledgeCardContent,
  MultipleChoiceCardContent,
  ClozeCardContent,
  QACardContent,
  type Flashcard
} from './representations'

interface CardProps {
  title?: string
  content?: ReactNode
  representations?: Flashcard[]
  isHighlighted?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  hideTitle?: boolean
}

function Card({
  title = 'Card Title',
  content = 'This is placeholder content for the card.',
  representations,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  hideTitle = false,
}: CardProps) {
  const [selectedRepresentationIndex, setSelectedRepresentationIndex] = useState(0)

  const contentStyles = {
    margin: 0,
    fontSize: '0.95em',
    lineHeight: '1.6',
    opacity: 0.9,
    whiteSpace: 'pre-line' as const,
  }

  const hasRepresentations = representations && representations.length > 0
  const currentRepresentation = hasRepresentations ? representations[selectedRepresentationIndex] : null

  // Determine title and content based on whether we have representations or simple content
  let displayTitle = title
  let displayContent = content
  let shouldHideTitle = hideTitle

  if (currentRepresentation) {
    if (currentRepresentation.card_type === 'knowledge') {
      displayTitle = currentRepresentation.title || title
      displayContent = <KnowledgeCardContent card={currentRepresentation} />
      // Knowledge cards usually show the title
    } else if (currentRepresentation.card_type === 'multiple_choice') {
      displayTitle = 'Multiple Choice Challenge'
      displayContent = <MultipleChoiceCardContent card={currentRepresentation} />
      shouldHideTitle = true
    } else if (currentRepresentation.card_type === 'cloze') {
      displayTitle = 'Cloze Recall Card'
      displayContent = <ClozeCardContent card={currentRepresentation} />
      shouldHideTitle = true
    } else if (currentRepresentation.card_type === 'qa') {
      displayTitle = 'Q&A Flashcard'
      displayContent = <QACardContent card={currentRepresentation} />
      shouldHideTitle = true
    }
  }

  const body = typeof displayContent === 'string'
    ? <p style={contentStyles}>{displayContent}</p>
    : <div style={contentStyles}>{displayContent}</div>

  const mappingIndexToType: Record<number, string> = {
    0: 'Knowledge Summary',
    1: 'Multiple Choice Challenge',
    2: 'Cloze Recall Card',
    3: 'Q&A Flashcard',
  }

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

      {/* Representation Picker */}
      {hasRepresentations && representations.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.12))',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.02em' }}>Card view</span>
            <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>Choose style</span>
          </div>
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              value={selectedRepresentationIndex}
              onChange={(e) => setSelectedRepresentationIndex(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#fff',
                appearance: 'none' as const,
                WebkitAppearance: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {representations.map((_, index) => (
                <option key={index} value={index} style={{ color: '#000' }}>
                  {mappingIndexToType[index] || `View ${index + 1}`}
                </option>
              ))}
            </select>
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.7rem',
              }}
            >
              ▼
            </span>
          </div>
        </div>
      )}

      {!shouldHideTitle && (
        <h3 className="title" style={{ margin: '0 0 12px 0', fontSize: '1.2em', fontWeight: 600 }}>
          {displayTitle}
        </h3>
      )}
      {body}
    </div>
  )
}

export default Card

// Re-export representations functionality
export {
  type Flashcard,
  KnowledgeCardContent,
  MultipleChoiceCardContent,
  ClozeCardContent,
  QACardContent,
  type QuizQuestion,
  type WrongAnswerPayload,
  extractMultiTypeFlashcards,
  extractQaFlashcards,
  pickWrongAnswerKey,
  buildWrongAnswerPayload,
  formatQAFlashcards,
} from './representations'

