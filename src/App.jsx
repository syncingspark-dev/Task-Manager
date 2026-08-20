import { useState } from 'react'
import Loginpage from './Pages/Loginpage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Loginpage />
    </>
  )
}

export default App
