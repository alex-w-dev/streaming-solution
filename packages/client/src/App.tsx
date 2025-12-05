import { Link, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div>
      <Outlet />
      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid #ccc' }}>
        <Link to="/">Главная</Link>
        <Link to="/test-websocket">Test WebSocket</Link>
        <Link to="/tanks">Танки</Link>
        <Link to="/battle">Битва</Link>
      </nav>
    </div>
  )
}

export default App
