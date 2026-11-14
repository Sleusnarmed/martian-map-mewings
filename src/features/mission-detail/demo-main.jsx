import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MissionDetailDemo from './MissionDetailDemo.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode><MissionDetailDemo /></StrictMode>,
)
