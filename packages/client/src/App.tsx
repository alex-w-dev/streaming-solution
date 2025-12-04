import { Link, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/">Главная</Link>
        <Link to="/test-websocket">Test WebSocket</Link>
        <Link to="/tanks">Танки</Link>
      </nav>
      <Outlet />
    </div>
  )
}

export default App
