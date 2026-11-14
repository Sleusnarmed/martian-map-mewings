import { useRef } from 'react'
import RegionDetail from './RegionDetail.jsx'
import MissionIcon from './MissionIcon.jsx'
import { formatMeters, formatMinutes, isAvailable } from './missionPresentation.js'

const tabs = [{ id: 'route', label: 'Route' }, { id: 'telemetry', label: 'Telemetry' }, { id: 'science', label: 'Science' }]

function RoutePage({ mission, onReturn, onInspectStop }) {
  const returning = mission.mode === 'return'
  const canReturn = isAvailable(mission.returnDurationSeconds) && mission.returnDurationSeconds >= 0
  return <><h2>{returning ? 'Return to base' : mission.status === 'arrived' ? 'Destination reached' : 'Your next reference'}</h2><p className="mt-panel-description">{returning ? 'Inbound' : 'Outbound'} · simulated excursion</p><div className="mt-next-reference"><MissionIcon name="locate" size={24} /><strong>{mission.nextWaypointName || 'No position data'}</strong></div><dl className="mt-summary-data"><div><dt>Distance remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd></div><div><dt>Estimated return</dt><dd>{formatMinutes(mission.returnDurationSeconds)}</dd></div></dl><div className="mt-route-actions"><button className="md-button md-button-primary" disabled={!onReturn || returning || !canReturn} onClick={onReturn}><MissionIcon name="return" />{returning ? 'Returning to base' : 'Return to base'}</button><button className="md-button md-button-quiet" onClick={onInspectStop}>Science stop<MissionIcon name="arrow-up-right" size={16} /></button></div><p className="mt-body-note">Crew position and route geometry are exercise placeholders. The geographic route will come from the shared map.</p></>
}

function TelemetryPage({ mission }) {
  const rows = [
    ['Time return margin', formatMinutes(mission.returnMarginSeconds)],
    ['Oxygen autonomy', formatMinutes(mission.oxygenRemainingSeconds)],
    ['Oxygen return margin', formatMinutes(mission.oxygenReturnMarginSeconds)],
    ['Exercise reserve', formatMinutes(mission.reserveSeconds)],
    ['Elapsed mission time', formatMinutes(mission.elapsedSeconds)],
    ['Mission budget', formatMinutes(mission.budgetSeconds)],
    ['Scenario delay', formatMinutes(mission.delaySeconds)],
  ]
  return <><h2>Telemetry</h2><p className="mt-panel-description">Simulated snapshot · no suit sensors connected</p><dl className="mt-telemetry-table">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="mt-body-note">Oxygen is an assumed duration, not tank pressure. Margins exclude the estimated return; missing values stay unavailable.</p></>
}

export default function MissionInfoPanel({ mission, region, image, activeTab, page, onTabChange, onPageChange, onReturn, onInspectStop, collapsed = false }) {
  const tabRefs = useRef([])
  function handleTabKey(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
    if (next === null) return
    event.preventDefault()
    onTabChange(tabs[next].id)
    tabRefs.current[next]?.focus()
  }
  return (
    <aside id="mission-information" className={`md-panel field-deck ${activeTab === 'science' ? 'has-pages' : ''}`} aria-label="Mission information" hidden={collapsed}>
      <div className="mt-tabs" role="tablist" aria-label="Mission information tabs">{tabs.map((tab, index) => <button key={tab.id} ref={(element) => { tabRefs.current[index] = element }} id={`mission-tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls="mission-active-panel" tabIndex={activeTab === tab.id ? 0 : -1} onKeyDown={(event) => handleTabKey(event, index)} onClick={() => onTabChange(tab.id)}>{tab.label}</button>)}</div>
      <section className="mt-tabpanel" role="tabpanel" id="mission-active-panel" aria-labelledby={`mission-tab-${activeTab}`} tabIndex={0}>
        {activeTab === 'route' && <RoutePage mission={mission} onReturn={onReturn} onInspectStop={onInspectStop} />}
        {activeTab === 'science' && <RegionDetail key={region?.id} region={region} image={image} page={page} />}
        {activeTab === 'telemetry' && <TelemetryPage mission={mission} />}
      </section>
      {activeTab === 'science' && <nav className="mt-page-controls" aria-label="Science information pages"><button className="md-button md-button-quiet" disabled={page === 0} onClick={() => onPageChange(page - 1)}><MissionIcon name="chevron-left" />Previous</button><span role="status" aria-live="polite">{page + 1} / 3</span>{page === 2 && region?.source ? <a className="md-button md-button-quiet" href={region.source} target="_blank" rel="noreferrer">NASA source<MissionIcon name="arrow-up-right" size={16} /></a> : <button className="md-button md-button-quiet" disabled={page >= 2} onClick={() => onPageChange(page + 1)}>Next<MissionIcon name="chevron" /></button>}</nav>}
    </aside>
  )
}
