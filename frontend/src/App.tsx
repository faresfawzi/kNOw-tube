import { useMemo, useEffect, useRef, useState } from 'react'
import Layout from './components/Layout'
import Youtube from './components/Youtube'
import CardList from './components/CardList'

function App() {
  // Extract 'v' parameter from URL query string
  const url = useMemo<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')

    if (!v) return undefined
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    return `https://www.youtube.com/watch?v=${v}`
  }, [])

  const [sizeControl, setSizeControl] = useState(0.3) // 0 to 1
  const [selectedIndex1, setSelectedIndex1] = useState<number | null>(null)
  const [selectedIndex2, setSelectedIndex2] = useState<number | null>(null)
  const [currentSmallWheelOffset, setCurrentSmallWheelOffset] = useState(0)

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
        if (parts.length == 2) {
          const wheelType = parts[0]
          const valueString = parts[1]
          const parsed = parseInt(valueString, 10)
          if (wheelType === 'smallWheel') {
            
            setCurrentSmallWheelOffset(parsed)
          } else if (wheelType === 'bigWheel') {
            setSizeControl((prev: number) => Math.min(1, Math.max(0, prev + parsed / SENSITIVITY)))
          }
        } else { // button
          console.log('Button actions:', dataString)
          if (dataString === 'moveRight') {
            console.log('Moving card right')
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

  const cards = [
    {
      title: 'Learning Path',
      content: 'Explore structured learning paths tailored to your goals and interests.',
    },
    {
      title: 'Quick Notes',
      content: 'Capture key insights and important points from your video content.',
    },
    {
      title: 'Study Tips',
      content: 'Discover effective study techniques and productivity hacks.',
    },
    {
      title: 'Resources',
      content: 'Access curated resources and materials to enhance your learning experience.',
    },
  ]

  const cards2 = [
    { title: "Flashcards", content: "Create and review flashcards to reinforce your understanding of key concepts." },
    { title: "Quizzes", content: "Test your knowledge with interactive quizzes based on the video content." },
    { title: "Progress Tracker", content: "Monitor your learning progress and track your achievements over time." },
    { title: "Community", content: "Connect with other learners and share insights about your learning journey." },
  ]

  const handleIndexChange = (index: number | null, setIndex: (val: number | null) => void, maxIndex: number, direction: 'up' | 'down') => {
    if (direction === 'down') {
      if (index === null) {
        setIndex(0)
      } else if (index < maxIndex) {
        setIndex(index + 1)
      } else {
        setIndex(0) // Wrap around
      }
    } else {
      if (index === null) {
        setIndex(maxIndex)
      } else if (index > 0) {
        setIndex(index - 1)
      } else {
        setIndex(maxIndex) // Wrap around
      }
    }
  }

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
        component3={<CardList cards={cards} selectedIndex={selectedIndex1} setSelectedIndex={setSelectedIndex1} currentSmallWheelOffset={currentSmallWheelOffset} />}
        component4={<CardList cards={cards2} selectedIndex={selectedIndex2} setSelectedIndex={setSelectedIndex2} currentSmallWheelOffset={currentSmallWheelOffset} />}
        sizeControl={sizeControl}
        setSizeControl={setSizeControl}
        shouldSizeControlBeVisible={false}
      />
    </>
  )
}

export default App
