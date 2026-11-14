import { useRef } from 'react'
import RegionDetail from './RegionDetail.jsx'

import MissionIcon from './MissionIcon.jsx'
import { formatMeters, formatMinutes } from './missionPresentation.js'

const tabs = [{ id: 'route', label: 'Route' }, { id: 'science', label: 'Science' }, { id: 'telemetry', label: 'Telemetry' }, { id: 'alerts', label: 'Alerts' }]
const pageCounts = { route: 2, science: 3, telemetry: 2, alerts: 2 }

function RoutePage({ mission, page, onInspectStop }) {
  if (page === 1) return <><h2>Route sequence</h2><p className="mt-panel-description">The return follows these references in reverse.</p><ol className="mt-waypoints"><li><strong>Simulated base</strong><span>Departure & return point</span></li><li><strong>Delta lookout</strong><span>Intermediate reference</span></li><li><strong>Wildcat Ridge</strong><span>Science destination</span></li></ol><button className="md-button md-button-outline" onClick={onInspectStop}>Open science stop <MissionIcon name="arrow-up-right" /></button></>
  return <><h2>{mission.mode === 'return' ? 'Return to base' : mission.status === 'arrived' ? 'Destination reached' : 'Your next reference'}</h2><p className="mt-panel-description">{mission.mode === 'return' ? 'Inbound' : 'Outbound'} · simulated excursion</p><div className="mt-next-reference"><MissionIcon name="locate" size={24} /><strong>{mission.nextWaypointName || 'No position data'}</strong></div><dl className="mt-summary-data"><div><dt>Distance remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd></div><div><dt>Estimated return</dt><dd>{formatMinutes(mission.returnDurationSeconds)}</dd></div></dl><p className="mt-body-note">Crew position and route geometry are exercise placeholders. The geographic route will come from the shared map.</p></>
}

function TelemetryPage({ mission, page }) {
  const rows = page === 0 ? [
    ['Time return margin', formatMinutes(mission.returnMarginSeconds)],
    ['Oxygen autonomy', formatMinutes(mission.oxygenRemainingSeconds)],
    ['Oxygen return margin', formatMinutes(mission.oxygenReturnMarginSeconds)],
    ['Exercise reserve', formatMinutes(mission.reserveSeconds)],
  ] : [
    ['Elapsed mission time', formatMinutes(mission.elapsedSeconds)],
    ['Mission budget', formatMinutes(mission.budgetSeconds)],
    ['Scenario delay', formatMinutes(mission.delaySeconds)],
  ]
  return <><h2>{page === 0 ? 'Return resources' : 'Exercise assumptions'}</h2><p className="mt-panel-description">Simulated snapshot · no suit sensors connected</p><dl className="mt-telemetry-table">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="mt-body-note">{page === 0 ? 'Oxygen is an assumed duration, not tank pressure. Margins exclude the estimated return.' : 'Consumption and reserve rules need validation with the route module. Missing values stay unavailable.'}</p></>
}

function AlertsPage({ mission, page }) {
  if (page === 1) return <><h2>What this notice means</h2><p className="mt-panel-description">Scenario rules & data provenance</p><ul className="mt-explanation"><li>The seismic alert is fictional. It is not a prediction for Jezero.</li><li>NASA imagery is historical evidence, not a live condition report.</li><li>Review both time and oxygen margins against the exercise reserve.</li></ul></>
  return <><h2>{mission.notice?.title || 'No current notice'}</h2><p className="mt-panel-description">{mission.notice?.provenance === 'simulation' ? 'Exercise notice · simulation' : 'Mission notice · verify source'}</p><p className="mt-full-notice">{mission.notice?.text || 'No notice data available.'}</p></>
}

export default function MissionInfoPanel({ mission, region, image, activeTab, page, onTabChange, onPageChange, onInspectStop }) {
  const tabRefs = useRef([])
  const warning = mission.notice?.level === 'warning'
  const pageCount = pageCounts[activeTab]
  function handleTabKey(event, index) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null
    if (next === null) return
    event.preventDefault()
    onTabChange(tabs[next].id)
    tabRefs.current[next]?.focus()
  }
  return (
    <aside className="md-panel md-detail mt-info" aria-label="Mission information">
      <div className="mt-tabs" role="tablist" aria-label="Mission information tabs">{tabs.map((tab, index) => <button key={tab.id} ref={(element) => { tabRefs.current[index] = element }} id={`mission-tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls={`mission-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onKeyDown={(event) => handleTabKey(event, index)} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === 'alerts' && warning && <span className="mt-alert-count" aria-label="1 exercise alert">1</span>}</button>)}</div>
      <section className="mt-tabpanel" role="tabpanel" id={`mission-panel-${activeTab}`} aria-labelledby={`mission-tab-${activeTab}`} tabIndex={0}>
        {activeTab === 'route' && <RoutePage mission={mission} page={page} onInspectStop={onInspectStop} />}
        {activeTab === 'science' && <RegionDetail key={region?.id} region={region} image={image} page={page} />}
        {activeTab === 'telemetry' && <TelemetryPage mission={mission} page={page} />}
        {activeTab === 'alerts' && <AlertsPage mission={mission} page={page} />}
      </section>
      <nav className="mt-page-controls" aria-label={`${activeTab} information pages`}><button className="md-button md-button-outline" disabled={page === 0} onClick={() => onPageChange(page - 1)}><MissionIcon name="chevron-left" />Previous</button><span role="status" aria-live="polite">{page + 1} / {pageCount}</span><button className="md-button md-button-outline" disabled={page >= pageCount - 1} onClick={() => onPageChange(page + 1)}>Next<MissionIcon name="chevron" /></button></nav>

    </aside>
  )
}
