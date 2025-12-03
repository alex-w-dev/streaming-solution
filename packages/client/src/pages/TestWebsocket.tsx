import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

const TestWebsocket = () => {
  const [responses, setResponses] = useState<string[]>([])

  useEffect(() => {
    socket = io('http://localhost:3000', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('connected', socket?.id)
    })

    socket.on('pong', (msg: string) => {
      setResponses((prev) => [...prev, msg])
    })

    return () => {
      socket?.disconnect()
    }
  }, [])

  const sendPing = () => {
    if (!socket) return
    socket.emit('ping', 'ping')
  }

  return (
    <>
      <h1>Test WebSocket</h1>
      <div className="card">
        <button onClick={sendPing}>Ping</button>
      </div>
      <ul>
        {responses.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </>
  )
}

export default TestWebsocket


