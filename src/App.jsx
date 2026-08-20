import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './Pages/Homepage'
import Loginpage from './Pages/Loginpage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Loginpage />} />
      <Route path="/home" element={<Homepage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
