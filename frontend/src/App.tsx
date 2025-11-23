import { useMemo, useEffect, useRef, useState, use } from 'react'
import Layout from './components/Layout'
import Youtube from './components/Youtube'
import CardList from './components/CardList'
import { Graph } from './components/Graph'
import type { ConceptTree } from './components/Graph'

import { FlashcardBoard } from './components/FlashcardBoard'
import type { Flashcard } from './components/card/representations/types';

// Mock concept tree data
const mockConceptTree: ConceptTree = {
  id: 'root',
  name: 'Learning Topics',
  type: 'concept',
  data: {
    concepts: 'Educational Content',
    description: 'Root node containing various learning topics and related videos',
    context: 'This is the main concept tree for organizing educational content'
  },
  children: [
    {
      id: 'ml-basics',
      name: 'Machine Learning Basics',
      type: 'concept',
      data: {
        concepts: 'Machine Learning',
        description: 'Fundamental concepts and techniques in machine learning including supervised and unsupervised learning',
        context: 'Covers neural networks, decision trees, and regression models'
      },
      children: [
        {
          id: 'neural-networks',
          name: 'Neural Networks',
          type: 'concept',
          data: {
            concepts: 'Neural Networks',
            description: 'Deep dive into artificial neural networks, backpropagation, and activation functions',
            context: 'Includes feedforward and convolutional neural network architectures'
          },
          children: [
            {
              id: 'video-nn-intro',
              name: 'Introduction to Neural Networks',
              type: 'video',
              data: {
                video_id: 'dQw4w9WgXcQ'
              }
            }
          ]
        },
        {
          id: 'video-ml-overview',
          name: 'ML Overview Video',
          type: 'video',
          data: {
            video_id: 'aircAruvnKk'
          }
        }
      ]
    },
    {
      id: 'data-science',
      name: 'Data Science',
      type: 'concept',
      data: {
        concepts: 'Data Science',
        description: 'Comprehensive guide to data science workflows, data preprocessing, and analysis techniques',
        context: 'Covers data collection, cleaning, visualization, and statistical analysis'
      },
      children: [
        {
          id: 'data-visualization',
          name: 'Data Visualization',
          type: 'concept',
          data: {
            concepts: 'Data Visualization',
            description: 'Techniques for creating effective visualizations and dashboards',
            context: 'Includes matplotlib, seaborn, and plotly examples'
          }
        },
        {
          id: 'video-ds-tutorial',
          name: 'Data Science Tutorial',
          type: 'video',
          data: {
            video_id: 'ua-CiDNNj30'
          }
        }
      ]
    },
    {
      id: 'video-main',
      name: 'Main Learning Video',
      type: 'video',
      data: {
        video_id: 'RBmOgQi4Fr0'
      }
    }
  ]
}

function App() {
  // Extract 'v' parameter from URL query string
  const url = useMemo<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')

    if (!v) return undefined
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    return `https://www.youtube.com/watch?v=${v}`
  }, [])

  const [sizeControl, setSizeControl] = useState(0.6)
  const [selectedIndex2, setSelectedIndex2] = useState<number | null>(null)
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null)
  const [currentSmallWheelOffset, setCurrentSmallWheelOffset] = useState(0)
  const [moveCardRight, setMoveCardRight] = useState(false)
  const [sendCardRight, setSendCardRight] = useState<Flashcard | null>(null)
  const [cards2, setCards2] = useState<Array<{ title: string; content: string }>>([
    { title: 'Flashcards', content: 'Create and review flashcards to reinforce your understanding of key concepts.' },
    { title: 'Quizzes', content: 'Test your knowledge with interactive quizzes based on the video content.' },
    { title: 'Progress Tracker', content: 'Monitor your learning progress and track your achievements over time.' },
    { title: 'Community', content: 'Connect with other learners and share insights about your learning journey.' },
  ])
  const [ keyText, setKeyText ] = useState<string>('')
   const [playbackRate, setPlaybackRate] = useState(1.0)

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
        // console.log('WebSocket message received:', dataString)
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
          } else if (dataString === 'getKeyText') {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send("test")
            }
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

  
  useEffect(() => {
    console.log('sendCardRight changed:', sendCardRight)
    if (sendCardRight) {
      console.log('Sending card right:', sendCardRight)
      // setCards2((prevCards2) => [...prevCards2, { title: sendCardRight.question, content: sendCardRight.answer }])
      //
      
      setSendCardRight(null)
    }
  }, [sendCardRight])

  useEffect(() => {
    console.log('keyText changed:', keyText)
    // post to action id: 1, text: keyText
    const sendKeyTextToBackend = async () => {
      await fetch(`/api/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 1, text: keyText }),
      })
    }
    sendKeyTextToBackend()
  }, [keyText])

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
        component1={<Graph conceptTree={mockConceptTree} />}
        component2={<Youtube url={url} currentSmallWheelOffset={currentSmallWheelOffset} />}
        component3={<FlashcardBoard videoUrl={url} moveCardRight={moveCardRight} setMoveCardRight={setMoveCardRight} setSendCardRight={setSendCardRight}
          setKeyText={setKeyText} />}
        component4={<CardList cards={cards2} selectedIndex={selectedIndex2} setSelectedIndex={setSelectedIndex2} currentSmallWheelOffset={currentSmallWheelOffset} />}
        sizeControl={sizeControl}
        setSizeControl={setSizeControl}
        shouldSizeControlBeVisible={true}
      />
    </>
  )
}

export default App
