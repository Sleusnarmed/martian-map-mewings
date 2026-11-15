import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useRouteMission } from '../route-planner/RouteMissionContext.js'
import { useMapLayers } from '../terrain/MapLayerContext.js'
import MissionIcon from '../mission-detail/MissionIcon.jsx'
import { askMissionAssistant } from './missionAssistant.js'
import { createVoiceSession, voiceActive } from './voiceSession.js'
import './local-ai.css'

const statusLabels = { idle: 'Listo para una orden', listening: 'Escuchando…', processing: 'Consultando Qwen…', speaking: 'Respondiendo…', result: 'Respuesta', error: 'No se completó la orden' }

export default function QwenVoiceControls({ panelTarget, open, onOpen, onClose, onActiveChange }) {
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
    const interrupt = event => { if (event.key === 'Escape' || document.hidden) session.cancel() }
    window.addEventListener('keydown', interrupt)
    document.addEventListener('visibilitychange', interrupt)
    return () => { window.removeEventListener('keydown', interrupt); document.removeEventListener('visibilitychange', interrupt); session.dispose() }
  }, [session])
  useEffect(() => { if (!open) session.cancel() }, [open, session])
  function start() { onOpen(); session.listen() }
  const panel = <section id="mission-qwen" className="field-qwen-panel" aria-label="Asistente Qwen" hidden={!open} lang="es">
    <div className="qwen-heading"><h2>Qwen</h2><button aria-label="Cerrar asistente Qwen" onClick={() => { session.cancel(); onClose() }}><MissionIcon name="close" /></button></div>
    <p className="qwen-state" role="status">{statusLabels[state.status]}</p>
    <div className="qwen-actions">
      <button className="md-button md-button-primary" onClick={active ? session.cancel : session.listen}>
        <MissionIcon name={active ? 'stop' : 'microphone'} /><span>{active ? 'Detener' : 'Hablar'}</span>
      </button>
      <button className="md-button md-button-outline" disabled={active} onClick={() => void session.submit('Explica por qué se eligió esta ruta o por qué no puede hacerse')}>
        Explicar ruta
      </button>
    </div>
    {state.message && <p className="qwen-feedback" role="status">{state.message}</p>}
    {state.transcript && <p className="qwen-transcript">Orden: «{state.transcript}»</p>}
    {state.text ? <p className="qwen-answer">{state.text}</p> : <p className="qwen-examples">«Muestra pendientes»<br />«Oculta geología»<br />«¿Por qué no puedo hacer esta ruta?»</p>}
    <p className="qwen-voice-note">Qwen local · Voz del navegador, puede requerir Internet. Escucha una orden por pulsación.</p>
  </section>
  return <>
    <button className="field-rail-button qwen-rail-button" data-mission-voice="true" aria-label={active ? 'Detener asistente Qwen' : 'Hablar con Qwen'} aria-pressed={active} aria-expanded={open} aria-controls="mission-qwen" onClick={active ? session.cancel : start}>
      <MissionIcon name={active ? 'stop' : 'microphone'} /><span>{active ? 'Detener' : 'Qwen'}</span>
    </button>
    {panelTarget && createPortal(panel, panelTarget)}
  </>
}
