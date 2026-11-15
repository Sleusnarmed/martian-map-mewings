import useMissionSpeech from './useMissionSpeech.js'
import MissionIcon from './MissionIcon.jsx'

export default function VoiceControls({ text, noticeId, lang = 'en-US', suspended = false }) {
  const { speechAvailable, chimeAvailable, status, muted, toggle } = useMissionSpeech(text, lang, noticeId, suspended)
  const active = ['chime', 'queued', 'speaking'].includes(status)
  const unavailable = !speechAvailable && !chimeAvailable
  const label = muted ? 'Muted' : active ? 'Mute' : status === 'blocked' ? 'Enable voice' : 'Voice'
  const message = unavailable ? 'Audio unavailable. Read Alerts.'
    : !speechAvailable ? 'Voice unavailable. Notification tone only.'
      : status === 'blocked' ? 'Tap to enable alert audio.'
        : status === 'error' ? 'Voice failed. Tap Voice to retry or read Alerts.'
          : muted ? 'Alert audio muted. Tap to resume.'
            : active ? 'Reading current notice.' : 'Automatic alert audio enabled.'
  const showStatus = unavailable || !speechAvailable || ['blocked', 'error'].includes(status)
  return (
    <div className="field-voice">
      <button className="md-button md-button-outline" data-mission-voice="true" data-audio-state={status} onClick={toggle} disabled={unavailable || !text} aria-pressed={muted} aria-label={active ? 'Mute alert audio' : muted ? 'Unmute and read current notice' : status === 'blocked' ? 'Enable alert audio' : 'Read current notice'}>
        <MissionIcon name={muted || active ? 'speaker-muted' : 'speaker'} /><span>{label}</span>
      </button>
      <span className={showStatus ? 'field-audio-error' : 'field-sr-only'} role="status">{message}</span>
    </div>
  )
}
