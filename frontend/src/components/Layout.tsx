import { type ReactNode } from 'react'

interface LayoutProps {
  component1: ReactNode
  component2: ReactNode
  component3: ReactNode
  component4: ReactNode
}

function Layout({ component1, component2, component3, component4 }: LayoutProps) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0
    }}>
      <div style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        borderRight: '1px solid #ccc'
      }}>
        {component1}
      </div>
      <div style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        borderRight: '1px solid #ccc'
      }}>
        {component2}
      </div>
      <div style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        borderRight: '1px solid #ccc'
      }}>
        {component3}
      </div>
      <div style={{
        flex: 1,
        height: '100%',
        overflow: 'auto'
      }}>
        {component4}
      </div>
    </div>
  )
}

export default Layout

