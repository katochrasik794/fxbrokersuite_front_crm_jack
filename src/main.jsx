import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Loader from './components/Loader.jsx'
import './index.css'

// Global error handler to suppress QUIC and network errors from external sources
window.addEventListener('error', (event) => {
  // Suppress QUIC protocol errors and missing resource errors from external sources
  if (
    event.message?.includes('QUIC') ||
    event.message?.includes('net::ERR_QUIC') ||
    event.message?.includes('QUIC_PROTOCOL_ERROR') ||
    event.filename?.includes('positions/stream') ||
    event.filename?.includes('apis/') ||
    event.target?.src?.includes('positions/stream') ||
    event.target?.href?.includes('positions/stream')
  ) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
}, true)

// Suppress unhandled promise rejections from network errors
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('QUIC') ||
    event.reason?.message?.includes('net::ERR_QUIC') ||
    event.reason?.message?.includes('QUIC_PROTOCOL_ERROR') ||
    event.reason?.stack?.includes('positions/stream') ||
    event.reason?.stack?.includes('apis/')
  ) {
    event.preventDefault()
    return false
  }
})

// Suppress console errors for QUIC and positions/stream
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  if (
    message.includes('QUIC') ||
    message.includes('net::ERR_QUIC') ||
    message.includes('QUIC_PROTOCOL_ERROR') ||
    message.includes('positions/stream') ||
    message.includes('apis/positions')
  ) {
    return // Suppress these errors
  }
  originalConsoleError.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Loader />
    <App />
  </React.StrictMode>,
)

