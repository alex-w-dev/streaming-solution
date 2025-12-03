import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import TestWebsocket from './pages/TestWebsocket.tsx'

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
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
