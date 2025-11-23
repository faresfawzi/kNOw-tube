import { useMemo, useEffect, useRef, useState, use } from 'react'
import Layout from './components/Layout'
import Youtube from './components/Youtube'
import CardList from './components/CardList'
import { Graph, isConceptTree } from './components/Graph'
import type { ConceptTree } from './components/Graph'
import LoadingSpinner from './components/LoadingSpinner'

import { FlashcardBoard } from './components/FlashcardBoard'
import type { Flashcard } from './components/card/representations/types';

function App() {
  // Extract 'v' parameter from URL query string
  const url = useMemo<string | undefined>(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')

    if (!v) return undefined
    if (v.startsWith('http://') || v.startsWith('https://')) return v
    return `https://www.youtube.com/watch?v=${v}`
  }, [])

  const [sizeControl, setSizeControl] = useState(0.33)
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
  const [givenAnswer, setGivenAnswer] = useState<string>('')
  const [keyText, setKeyText] = useState<string>('')
  const [timestamp, setTimestamp] = useState(0)

  const SENSITIVITY = 1000

  // WebSocket integration
  const [wsStatus, setWsStatus] = useState<string>('Disconnected')
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const [conceptTree, setConceptTree] = useState<ConceptTree | undefined>(undefined)
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)

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
          } else if (dataString.includes('option')) {
            const answer = dataString.charAt(dataString.length - 1)
            // remap 4 to 1, 5 to 2, 6 to 3, 8 to 4
            let mappedAnswer = answer
            if (answer === '4') mappedAnswer = '1'
            else if (answer === '5') mappedAnswer = '2'
            else if (answer === '6') mappedAnswer = '3'
            else if (answer === '8') mappedAnswer = '4'
            setGivenAnswer(mappedAnswer)
            console.log('Given answer:', mappedAnswer)
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

  // Fetch graph data when url changes
  useEffect(() => {
    if (!url) return

    const videoId = new URLSearchParams(new URL(url).search).get('v')
    if (!videoId) return

    const fetchGraphData = async () => {
      setIsLoadingGraph(true)
      try {
        const response = await fetch(`/api/graph/video-item-descriptions?video_id=${videoId}`)
        if (response.ok) {
          const data = await response.json()
          // console.log('Graph data:', data)

          const transformedData: ConceptTree = {
            id: 'video',
            name: '',
            type: 'video',
            data: {
              video_id: data.video_id
            },
            children: data.items
          }

          console.log('APP passing in graph data:', transformedData)

          if (isConceptTree(transformedData)) {
            setConceptTree(transformedData)
          } else {
            console.error('Invalid graph data format:', transformedData)
          }
        } else {
          console.error('Failed to fetch graph data')
        }
      } catch (error) {
        console.error('Error fetching graph data:', error)
      } finally {
        setIsLoadingGraph(false)
      }
    }

    fetchGraphData()
  }, [url])



  return (
    <>
      <div>

        {/* <div>
          <input
            type="text"
            value={keyText}
            onChange={(e) => setKeyText(e.target.value)}
            placeholder="Enter key text"
            style={{ width: '100%', padding: '8px', fontSize: '1rem' }}
          />
        </div> */}
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
        component1={
          isLoadingGraph ? (
            <LoadingSpinner />
          ) : (
            <Graph conceptTree={conceptTree} />
          )
        }
        component2={<Youtube url={url} currentSmallWheelOffset={currentSmallWheelOffset} setTimestamp={setTimestamp} />}
        component3={<FlashcardBoard videoUrl={url} moveCardRight={moveCardRight} setMoveCardRight={setMoveCardRight} setSendCardRight={setSendCardRight}
          setKeyText={setKeyText} timestamp={timestamp} givenAnswer={givenAnswer} setGivenAnswer={setGivenAnswer} />}
        component4={<CardList cards={cards2} selectedIndex={selectedIndex2} setSelectedIndex={setSelectedIndex2} currentSmallWheelOffset={currentSmallWheelOffset} />}
        sizeControl={sizeControl}
        setSizeControl={setSizeControl}
        shouldSizeControlBeVisible={false}
      />
    </>
  )
}

export default App
