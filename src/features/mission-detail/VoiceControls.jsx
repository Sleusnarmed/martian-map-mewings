import useMissionSpeech from './useMissionSpeech.js'
import MissionIcon from './MissionIcon.jsx'

export default function VoiceControls({ text, lang = 'en-US', compact = false }) {
  const { supported, status, speak, stop } = useMissionSpeech(text, lang)
  const active = status === 'speaking' || status === 'queued'
  if (compact) return <div className="field-voice"><button className="md-button md-button-outline" onClick={active ? stop : speak} disabled={!supported || !text} aria-label={active ? 'Stop notice playback' : 'Read current notice'}><MissionIcon name={active ? 'stop' : 'speaker'} size={22} /><span>{active ? 'Stop' : 'Voice'}</span></button><span className={!supported || status === 'error' ? 'field-audio-error' : 'field-sr-only'} role="status">{!supported ? 'Audio unavailable' : status === 'error' ? 'Audio failed. Read Alerts.' : active ? 'Reading current notice' : 'Voice ready · English'}</span></div>
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
