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

  return (
    <Layout
      component1={<div>Component 1 - WS Status: {wsStatus}</div>}
      component2={<Youtube url={url} />}
      component3={<CardList cards={cards} />}
      component4={<CardList cards={cards2} />}
    />
  )
}

export default App
