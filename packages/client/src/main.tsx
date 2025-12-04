import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import TestWebsocket from './pages/TestWebsocket.tsx'
import TanksList from './pages/TanksList.tsx'
import Battle from './pages/Battle.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route
            index
            element={<div>Главная страница (добавь сюда контент по желанию)</div>}
          />
          <Route path="test-websocket" element={<TestWebsocket />} />
          <Route path="tanks" element={<TanksList />} />
          <Route path="battle" element={<Battle />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
