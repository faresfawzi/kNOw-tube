import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface BackendData {
  users?: Array<{ id: number; name: string; role: string }>
  message?: string
}

function App() {
  const [count, setCount] = useState(0)
  const [backendData, setBackendData] = useState<BackendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested')

  const testBackendConnection = async () => {
    setLoading(true)
    setError(null)
    setConnectionStatus('Testing...')

    try {
      // Test root endpoint
      const rootResponse = await fetch('/api/')
      const rootData = await rootResponse.json()
      console.log('Root endpoint:', rootData)

      // Test data endpoint
      const dataResponse = await fetch('/api/data')
      if (!dataResponse.ok) {
        throw new Error(`HTTP error! status: ${dataResponse.status}`)
      }
      const data = await dataResponse.json()
      setBackendData(data)
      setConnectionStatus('✅ Connected!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setConnectionStatus('❌ Connection failed')
      console.error('Backend connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Test connection on component mount
  useEffect(() => {
    testBackendConnection()
  }, [])

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      
      {/* Backend Connection Test */}
      <div className="card">
        <h2>Backend Connection Test</h2>
        <p>Status: <strong>{connectionStatus}</strong></p>
        <button onClick={testBackendConnection} disabled={loading}>
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>
        
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {backendData && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <h3>Backend Response:</h3>
            <pre style={{ 
              background: '#f4f4f4', 
              padding: '10px', 
              borderRadius: '5px',
              overflow: 'auto'
            }}>
              {JSON.stringify(backendData, null, 2)}
            </pre>
            {backendData.users && (
              <div style={{ marginTop: '10px' }}>
                <h4>Users:</h4>
                <ul>
                  {backendData.users.map((user) => (
                    <li key={user.id}>
                      {user.name} - {user.role}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
