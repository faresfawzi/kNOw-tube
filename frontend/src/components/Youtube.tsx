import { useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

interface YoutubeProps {
  url?: string
  width?: string | number
  height?: string | number
  currentSmallWheelOffset?: number
  setTimestamp?: React.Dispatch<React.SetStateAction<number>>
  active?: boolean
}

function Youtube({ 
  url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  width = '100%',
  height = '100%',
  currentSmallWheelOffset = 0,
  setTimestamp
}: YoutubeProps) {
  const [playbackRate, setPlaybackRate] = useState(1.0)
  

  useEffect(() => {
    console.log('Youtube component - currentSmallWheelOffset changed:', currentSmallWheelOffset)
    // Handle small wheel offset for video control if needed
    if (currentSmallWheelOffset === 0) return
    
    // Example: Adjust playback rate based on wheel offset
    // This is just a placeholder logic; you can customize it as needed
    // Positive offset increases speed, negative decreases
    // Assuming we have a state or ref to control playback rate
    // Here we just log the intended change
    console.log('Adjusting playback rate by:', currentSmallWheelOffset / 1000)

    setPlaybackRate((prevRate) => {
      let newRate = prevRate + currentSmallWheelOffset / 10
      console.log('New playback rate:', newRate)
      if (newRate < 0.25) newRate = 0.25 // Minimum playback rate
      if (newRate > 2.0) newRate = 2.0   // Maximum playback rate
      return newRate
    })
  }, [currentSmallWheelOffset])


  return (
    <div style={{ width, height }}>
      <ReactPlayer
        src={url}
        width={width}
        height={height}
        controls={true}
        playbackRate={playbackRate}
        onTimeUpdate={(e) => setTimestamp && setTimestamp(e.timeStamp)}
      />
    </div>
  )
}

export default Youtube

