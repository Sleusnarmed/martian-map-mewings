import useMissionSpeech from './useMissionSpeech.js'
import MissionIcon from './MissionIcon.jsx'

export default function VoiceControls({ text, lang = 'en-US' }) {
  const { supported, status, speak, stop } = useMissionSpeech(text, lang)
  const active = status === 'speaking' || status === 'queued'
  return (
    <div className="md-voice">
      <div className="md-button-row">
        <button className="md-button md-button-outline" onClick={speak} disabled={!supported || !text}><MissionIcon name="speaker" />Listen to notice</button>
        <button className="md-button md-button-quiet" onClick={stop} disabled={!active}><MissionIcon name="stop" size={16} />Stop</button>
      </div>
      <span className="md-muted" role="status">
        {!supported ? 'Voice unavailable in this browser. Read the notice above.' : status === 'error' ? 'Audio could not play. The notice remains available above.' : active ? 'Reading the current notice…' : 'On-demand voice · English'}
      </span>
    </div>
  )
}
