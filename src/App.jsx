import { Navigate, Route, Routes } from 'react-router-dom'
import Homepage from './Pages/Homepage'
import Loginpage from './Pages/Loginpage'
import ProtectedRoute from './ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Loginpage />} />
      <Route path="/home" element={<ProtectedRoute><Homepage /></ProtectedRoute> } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
