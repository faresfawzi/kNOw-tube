import { useMemo, useEffect, useRef, useState, use } from 'react'
import Layout from './components/Layout'
import Youtube from './components/Youtube'
import CardList from './components/CardList'

import { FlashcardBoard } from './components/FlashcardBoard'
import type { QAFlashcard } from './components/FlashcardBoard';

function App() {
  // Extract 'v' parameter from URL query string
  const url = useMemo<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')

    if (!v) return undefined
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    return `https://www.youtube.com/watch?v=${v}`
  }, [])

  const [sizeControl, setSizeControl] = useState(0.3)
  const [selectedIndex2, setSelectedIndex2] = useState<number | null>(null)
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null)
  const [currentSmallWheelOffset, setCurrentSmallWheelOffset] = useState(0)
  const [moveCardRight, setMoveCardRight] = useState(false)
  const [sendCardRight, setSendCardRight] = useState<QAFlashcard| null>(null)

  const SENSITIVITY = 1000

  // WebSocket integration
  const [wsStatus, setWsStatus] = useState<string>('Disconnected')
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      const ws: WebSocket = new WebSocket('ws://localhost:5005')
      wsRef.current = ws
      setWsStatus('Connecting')

      ws.onopen = () => {
        setWsStatus('Connected')
      }

      ws.onmessage = (event: MessageEvent) => {
        // event.data is string | Blob | ArrayBuffer, so cast
        const dataString = typeof event.data === 'string'
          ? event.data
          : JSON.stringify(event.data)

        setWsMessages((prev: string[]) => [...prev, dataString])
        console.log('WebSocket message received:', dataString)
        // Expecting messages like "smallWheel_1" or "bigWheel_-2"
        const parts = dataString.split('_')
        if (parts.length === 2) {
          const wheelType = parts[0]
          const valueString = parts[1]
          const parsed = parseInt(valueString, 10)
          if (Number.isNaN(parsed)) return

          if (wheelType === 'smallWheel') {
            setCurrentSmallWheelOffset(parsed)
          } else if (wheelType === 'bigWheel') {
            setSizeControl((prev) => Math.min(1, Math.max(0, prev + parsed / SENSITIVITY)))
          }
        } else {
          console.log('Button actions:', dataString)
          if (dataString === 'moveRight') {
            console.log('Moving card right pressed')
            setMoveCardRight(true)
          }
        }
      }

      ws.onclose = () => {
        setWsStatus('Disconnected')
        setTimeout(connectWebSocket, 2000)
      }

      ws.onerror = () => {
        setWsStatus('Error')
      }
    }

    connectWebSocket()
    return () => wsRef.current?.close()
  }, [])

  const cards2 = [
    { title: 'Flashcards', content: 'Create and review flashcards to reinforce your understanding of key concepts.' },
    { title: 'Quizzes', content: 'Test your knowledge with interactive quizzes based on the video content.' },
    { title: 'Progress Tracker', content: 'Monitor your learning progress and track your achievements over time.' },
    { title: 'Community', content: 'Connect with other learners and share insights about your learning journey.' },
  ]

  useEffect(() => {
    if (sendCardRight) {
      console.log('Sending card right:', sendCardRight)
    }
  }, [sendCardRight])

  return (
    <>
      <div>
        {/* <div>
          <label>Card List 1</label>
          <div>
            <button onClick={() => handleIndexChange(selectedIndex1, setSelectedIndex1, cards.length - 1, 'up')}>
              ↑
            </button>
            <button onClick={() => handleIndexChange(selectedIndex1, setSelectedIndex1, cards.length - 1, 'down')}>
              ↓
            </button>
          </div>
          <span>{selectedIndex1 !== null ? selectedIndex1 : 'None'}</span>
        </div>
        <div>
          <label>Card List 2</label>
          <div>
            <button onClick={() => handleIndexChange(selectedIndex2, setSelectedIndex2, cards2.length - 1, 'up')}>
              ↑
            </button>
            <button onClick={() => handleIndexChange(selectedIndex2, setSelectedIndex2, cards2.length - 1, 'down')}>
              ↓
            </button>
          </div>
          <span>{selectedIndex2 !== null ? selectedIndex2 : 'None'}</span>
        </div> */}
      </div>
      <Layout
        component1={<div>Concept Graph</div>}
        component2={<Youtube url={url} />}
        component3={<FlashcardBoard videoUrl={url} moveCardRight={moveCardRight} setMoveCardRight={setMoveCardRight} setSendCardRight={setSendCardRight} />}
        component4={<CardList cards={cards2} selectedIndex={selectedIndex2} setSelectedIndex={setSelectedIndex2} currentSmallWheelOffset={currentSmallWheelOffset} />}
        sizeControl={sizeControl}
        setSizeControl={setSizeControl}
        shouldSizeControlBeVisible={false}
      />
    </>
  )
}

export default App
