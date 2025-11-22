import { useMemo } from 'react'
import Layout from './components/Layout'
import Youtube from './components/Youtube'
import CardList from './components/CardList'

function App() {
  // Extract 'v' parameter from URL query string
  const url = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    const v = params.get('v')
    
    if (!v) return undefined
    
    // If it's already a full URL, use it directly
    if (v.startsWith('http://') || v.startsWith('https://')) {
      return v
    }
    
    // Otherwise, construct YouTube URL from video ID
    return `https://www.youtube.com/watch?v=${v}`
  }, [])

  const cards = [
    { title: "Learning Path", content: "Explore structured learning paths tailored to your goals and interests." },
    { title: "Quick Notes", content: "Capture key insights and important points from your video content." },
    { title: "Study Tips", content: "Discover effective study techniques and productivity hacks." },
    { title: "Resources", content: "Access curated resources and materials to enhance your learning experience." },
  ]

  return (
    <Layout
      component1={<div>Component 1</div>}
      component2={<Youtube url={url} />}
      component3={<CardList cards={cards} />}
      component4={<div>Component 4</div>}
    />
  )
}

export default App
