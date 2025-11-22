import ReactPlayer from 'react-player'

interface YoutubeProps {
  url?: string
  width?: string | number
  height?: string | number
}

function Youtube({ 
  url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  width = '100%',
  height = '100%'
}: YoutubeProps) {
  return (
    <div style={{ width, height }}>
      <ReactPlayer
        src={url}
        width={width}
        height={height}
        controls={true}
      />
    </div>
  )
}

export default Youtube

