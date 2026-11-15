import { useRef } from 'react'
import RegionDetail from './RegionDetail.jsx'
import TerrainPointDetails from '../terrain/TerrainPointDetails.jsx'
import MissionIcon from './MissionIcon.jsx'
import useOverflowIndicator from './useOverflowIndicator.js'
import { formatMeters, formatMinutes, isAvailable } from './missionPresentation.js'
import { useRouteMission } from '../route-planner/RouteMissionContext.js'
import RoutePlanner from '../route-planner/RoutePlanner.jsx'

const tabs = [{ id: 'route', label: 'Route' }, { id: 'telemetry', label: 'Telemetry' }, { id: 'science', label: 'Science' }]

function RoutePage({ mission, onReturn, onInspectStop }) {
  const returning = mission.mode === 'return'
  const canReturn = isAvailable(mission.returnDurationSeconds) && mission.returnDurationSeconds >= 0
  return <><h2>{returning ? 'Return to base' : mission.status === 'arrived' ? 'Destination reached' : 'Your destination'}</h2><p className="mt-panel-description">{returning ? 'Inbound to A · Base' : 'Outbound to B · Wildcat Ridge'}</p><div className="mt-next-reference"><MissionIcon name="locate" size={24} /><strong>{mission.nextWaypointName || 'No position data'}</strong></div><dl className="mt-summary-data"><div><dt>Distance remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd></div><div><dt>Estimated return</dt><dd>{formatMinutes(mission.returnDurationSeconds)}</dd></div></dl><div className="mt-route-actions"><button className="md-button md-button-primary" disabled={!onReturn || returning || !canReturn} onClick={onReturn}><MissionIcon name="return" />{returning ? 'Returning to base' : 'Return to base'}</button><button className="md-button md-button-quiet" onClick={onInspectStop}>Science stop<MissionIcon name="arrow-up-right" size={16} /></button></div><p className="mt-body-note">Keep both time and oxygen return margins above the required reserve.</p></>
}

function TelemetryPage({ mission }) {
  const rows = [
    ['Time return margin', formatMinutes(mission.returnMarginSeconds)],
    ['Oxygen autonomy', formatMinutes(mission.oxygenRemainingSeconds)],
    ['Oxygen return margin', formatMinutes(mission.oxygenReturnMarginSeconds)],
    ['Required reserve', formatMinutes(mission.reserveSeconds)],
    ['Elapsed mission time', formatMinutes(mission.elapsedSeconds)],
    ['Mission budget', formatMinutes(mission.budgetSeconds)],
    ['Added delays', formatMinutes(mission.delaySeconds)],
  ]
  return <><h2>Telemetry</h2><p className="mt-panel-description">Simulated mission time and return resources</p><dl className="mt-telemetry-table">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="mt-body-note">{mission.telemetryNote ?? 'Oxygen autonomy is shown as time remaining. Return margins account for the estimated journey back.'}</p></>
}

export default function MissionInfoPanel({ mission, region, sciencePoint, routePoint, onUseSciencePoint, image, activeTab, page, contentRef, onTabChange, onPageChange, onReturn, onInspectStop, collapsed = false }) {
  const planned = useRouteMission()
  const tabRefs = useRef([])
  const panelRef = useRef(null)
  useOverflowIndicator(panelRef, `${activeTab}-${page}-${region?.id}-${sciencePoint?.id}`)
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
      <section key={`${activeTab}-${page}-${region?.id}-${sciencePoint?.id}`} ref={panelRef} className="mt-tabpanel" role="tabpanel" id="mission-active-panel" aria-labelledby={`mission-tab-${activeTab}`} tabIndex={0}>
        <div ref={contentRef} className="mt-panel-content">
        {activeTab === 'route' && (planned ? <RoutePlanner /> : <RoutePage mission={mission} onReturn={onReturn} onInspectStop={onInspectStop} />)}
        {activeTab === 'science' && (sciencePoint ? <TerrainPointDetails selection={sciencePoint} page={page} /> : <RegionDetail key={region?.id} region={region} image={image} page={page} />)}
        {activeTab === 'science' && planned && routePoint && <div className="mt-route-actions" aria-label="Use science point in route">
          {['a', 'b'].map(target => <button key={target} className="md-button md-button-outline" disabled={!planned.terrain}
            aria-pressed={planned.state[target]?.latitude === routePoint.latitude && planned.state[target]?.longitude === routePoint.longitude}
            onClick={() => onUseSciencePoint(target, routePoint)}>Use as {target.toUpperCase()}</button>)}
        </div>}
        {activeTab === 'telemetry' && <TelemetryPage mission={mission} />}
        </div>
      </section>
      {activeTab === 'science' && <nav className="mt-page-controls" aria-label="Science information pages"><button className="md-button md-button-quiet" disabled={page === 0} onClick={() => onPageChange((current) => current - 1)}><MissionIcon name="chevron-left" />Previous</button><span role="status" aria-live="polite">{page + 1} / 3</span><button className="md-button md-button-quiet" disabled={page >= 2} onClick={() => onPageChange((current) => current + 1)}>Next<MissionIcon name="chevron" /></button></nav>}
    </aside>
  )
}
