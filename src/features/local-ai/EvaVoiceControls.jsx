import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouteMission } from '../route-planner/RouteMissionContext.js'
import { useMapLayers } from '../terrain/MapLayerContext.js'
import MissionIcon from '../mission-detail/MissionIcon.jsx'
import { askMissionAssistant } from './missionAssistant.js'
import { createVoiceSession, voiceActive } from './voiceSession.js'
import { publishCaption } from './speechCaptions.js'
import './local-ai.css'

const statusLabels = { starting: 'Starting microphone…', listening: 'Listening…', transcribing: 'Transcribing…', processing: 'EVA is thinking…', speaking: 'Speaking…' }

export default function EvaVoiceControls({ onActiveChange }) {
  const mission = useRouteMission()
  const layers = useMapLayers()
  const current = useRef({ mission, layers })
  useEffect(() => { current.current = { mission, layers } }, [mission, layers])
  const [session] = useState(() => createVoiceSession(window))
  useEffect(() => { session.setCommandHandler((question, signal) => askMissionAssistant(question, {
    signal, getState: () => current.current.mission.state, getLayers: () => current.current.layers,
  })) }, [session])
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot)
  const active = voiceActive(state.status)
  const notice = mission.state.notice
  const previousNotice = useRef(notice.id)
  useEffect(() => {
    if (previousNotice.current !== notice.id && notice.level === 'warning') session.cancel()
    previousNotice.current = notice.id
  }, [notice, session])
  useEffect(() => { onActiveChange(active) }, [active, onActiveChange])
  useEffect(() => {
    if (state.message) publishCaption(window, 'eva', [state.message, state.text].filter(Boolean).join(' '))
  }, [state.message, state.text])
  useEffect(() => {
    const interrupt = event => { if (event.key === 'Escape' || document.hidden) session.cancel() }
    window.addEventListener('keydown', interrupt)
    document.addEventListener('visibilitychange', interrupt)
    return () => { window.removeEventListener('keydown', interrupt); document.removeEventListener('visibilitychange', interrupt); session.dispose() }
  }, [session])
  return <div className="eva-control">
    <button className="field-rail-button eva-rail-button" data-mission-voice="true" aria-label={state.status === 'listening' ? 'Finish voice command' : active ? 'Stop EVA' : 'Talk to EVA'} aria-pressed={active} aria-describedby="eva-status" title="Speak English or Spanish. Pause or press EVA to send; Escape cancels. EVA replies in English." onClick={state.status === 'listening' ? session.finishListening : active ? session.cancel : () => void session.listen()}>
      <MissionIcon name={active ? 'stop' : 'microphone'} /><span>EVA</span>
    </button>
    <div className={active ? 'eva-status' : 'field-sr-only'} data-state={state.status}>
      <span id="eva-status" role="status" aria-live="polite" aria-atomic="true">{statusLabels[state.status] ?? (state.status === 'error' ? 'Command not completed. See the notification.' : 'Ready. Press EVA and speak English or Spanish.')}</span>
      {state.status === 'listening' && state.meterAvailable && <meter className="eva-input-level" aria-label="Microphone input level" title={state.deviceName} min="0" max="100" value={state.inputLevel} />}
    </div>
  </div>
}
