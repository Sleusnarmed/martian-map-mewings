import { useEffect, useState } from 'react'
import { CAPTION_EVENT } from './speechCaptions.js'
import MissionIcon from '../mission-detail/MissionIcon.jsx'

export default function SpeechCaptions({ hasRoute }) {
  const [caption, setCaption] = useState(null)
  useEffect(() => {
    const receive = ({ detail }) => setCaption(current => detail.text ? detail : current?.source === detail.source ? null : current)
    window.addEventListener(CAPTION_EVENT, receive)
    return () => window.removeEventListener(CAPTION_EVENT, receive)
  }, [])
  return <div className={`mission-captions ${hasRoute ? 'above-route' : ''}`} aria-live="polite" aria-atomic="true">
    {caption && <div className="mission-caption-text"><span>{caption.text}</span><button aria-label="Ocultar subtítulo" onClick={() => setCaption(null)}><MissionIcon name="close" /></button></div>}
  </div>
}
