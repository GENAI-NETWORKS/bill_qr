import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Polyfill for insecure contexts (HTTP) to prevent camera libraries from crashing the app
if (typeof navigator !== 'undefined') {
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {};
  }
  if (!navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = () => Promise.resolve([]);
  }
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('HTTPS is required'));
  }
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
