import Layout from './components/Layout'
import Youtube from './components/Youtube'

function App() {
  return (
    <Layout
      component1={<Youtube />}
      component2={<div>Component 2</div>}
      component3={<div>Component 3</div>}
      component4={<div>Component 4</div>}
    />
  )
}

export default App
