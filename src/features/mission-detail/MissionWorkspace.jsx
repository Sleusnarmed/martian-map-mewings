import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouteMission } from '../route-planner/RouteMissionContext.js'
import CoordinateInspector from '../route-planner/CoordinateInspector.jsx'
import MissionHUD from './MissionHUD.jsx'
import MissionInfoPanel from './MissionInfoPanel.jsx'
import MissionAlerts from './MissionAlerts.jsx'
import VoiceControls from './VoiceControls.jsx'
import useFadingView from './useFadingView.js'
import { demoScenarios, missingMission, regions, wildcatImage } from './demoMission.js'
import MissionIcon from './MissionIcon.jsx'
import './mission-detail.css'
import './tablet-mission.css'

// Optional review links initialize a fixture without changing the normal open-panel demo.
function readPreviewLocation() {
  const query = new URLSearchParams(window.location.search)
  const scenarioId = demoScenarios.some((scenario) => scenario.id === query.get('scenario')) ? query.get('scenario') : 'normal'
  const fallbackTab = scenarioId === 'arrival' ? 'science' : 'route'
  const activeTab = ['route', 'telemetry', 'science'].includes(query.get('tab')) ? query.get('tab') : fallbackTab
  const lastPage = activeTab === 'science' ? 2 : 0
  const requestedPage = Number(query.get('page') || 0)
  const page = Number.isInteger(requestedPage) ? Math.max(0, Math.min(lastPage, requestedPage)) : 0
  return { scenarioId, activeTab, page, panel: query.get('panel') === 'closed' ? null : query.get('tab') === 'alerts' || query.get('panel') === 'alerts' || scenarioId.includes('delay') ? 'alerts' : 'information' }
}

export default function MissionWorkspace({ MapComponent, initialRegionId = 'wildcat-ridge', onBackToGlobe, integrated = false }) {
  const planned = useRouteMission()
  const [preview] = useState(readPreviewLocation)
  const information = useFadingView({ tab: preview.activeTab, page: preview.page, regionId: initialRegionId }, (value) => `${value.tab}-${value.page}-${value.regionId}`)
  const [mapSelection, setMapSelection] = useState({ id: initialRegionId, revision: 0 })
  const [mapToolsTarget, setMapToolsTarget] = useState(null)
  const [mapNavigationTarget, setMapNavigationTarget] = useState(null)
  const { tab: activeTab, page, regionId: selectedRegionId } = information.value
  const [scenarioId, setScenarioId] = useState(preview.scenarioId)
  const [returning, setReturning] = useState(false)
  const [hideData, setHideData] = useState(false)
  const panel = useFadingView(preview.panel)
  const { value: openPanel, change: setOpenPanel, ref: overlayRef } = panel
  const focusAfterOpen = useRef(null)
  const selectedScenario = demoScenarios.find((scenario) => scenario.id === scenarioId)
  const baseMission = hideData ? missingMission : selectedScenario
  // Demo adapter only: no telemetry stream or navigation hardware is connected.
  const fixtureMission = returning && !hideData ? {
    ...baseMission, mode: 'return', status: 'in-progress', nextWaypointName: 'Base',
    remainingDistanceMeters: baseMission.returnDistanceMeters,
    notice: { ...baseMission.notice, id: `${baseMission.notice.id}-return`, title: 'Return route selected',
      text: 'Return to point A, Base. Follow the return route and monitor your time and oxygen margins.' },
  } : baseMission
  const mission = planned?.mission ?? fixtureMission
  const lastNotice = useRef(null)
  useEffect(() => {
    if (!planned || lastNotice.current === mission.notice?.id) return
    lastNotice.current = mission.notice?.id
    if (mission.notice?.level === 'warning') setOpenPanel('alerts')
  }, [planned, mission.notice, setOpenPanel])
  useLayoutEffect(() => {
    if (openPanel === 'information' && focusAfterOpen.current) {
      document.getElementById(`mission-tab-${focusAfterOpen.current}`)?.focus()
      focusAfterOpen.current = null
    }
  }, [openPanel])

  function changeTab(tab) { information.change((current) => ({ ...current, tab, page: 0 })) }
  function changePage(update) {
    information.change((current) => ({ ...current, page: current.tab === 'science' ? Math.max(0, Math.min(2, typeof update === 'function' ? update(current.page) : update)) : 0 }))
  }
  function openInformation(tab) {
    planned?.dispatch({ type: 'dismiss-inspection' })
    planned?.dispatch({ type: 'pick', target: null })
    changeTab(tab); setOpenPanel('information')
    focusInformationTab(tab)
  }
  function focusInformationTab(tab) {
    if (openPanel === 'information') {
      document.getElementById(`mission-tab-${tab}`)?.focus()
      focusAfterOpen.current = null
    } else focusAfterOpen.current = tab
  }
  function togglePanel(name) {
    planned?.dispatch({ type: 'dismiss-inspection' })
    planned?.dispatch({ type: 'pick', target: null })
    focusAfterOpen.current = null
    setOpenPanel((current) => current === name ? null : name)
  }
  function selectRegion(id, moveCamera = true) {
    if (id === 'syrtis-major' && onBackToGlobe) { onBackToGlobe(); return }
    if (moveCamera) setMapSelection((current) => ({ id, revision: current.revision + 1 }))
    information.change((current) => ({ ...current, regionId: id, tab: 'science', page: 0 }))
    setOpenPanel('information')
    focusInformationTab('science')
  }
  function selectScenario(id) {
    focusAfterOpen.current = null
    setScenarioId(id); setReturning(false); setHideData(false)
    setOpenPanel(id.includes('delay') ? 'alerts' : 'information')
    information.change((current) => ({ ...current, tab: id === 'arrival' ? 'science' : 'route', regionId: id === 'arrival' ? 'wildcat-ridge' : current.regionId, page: 0 }))
  }

  return (
    <div className={`md-demo field-shell ${integrated ? 'has-terrain' : ''} ${planned ? 'has-route-planner' : ''}`}>
      <a className="md-skip-link" href="#map-viewport" onClick={event => { event.preventDefault(); document.getElementById('map-viewport')?.focus() }}>Skip to map</a>
      {MapComponent && <MapComponent onPointSelect={id => selectRegion(id, false)} focusPointId={mapSelection.id} focusRevision={mapSelection.revision} controlsTarget={mapToolsTarget} navigationTarget={mapNavigationTarget} initialPointId={initialRegionId} />}
      {onBackToGlobe && <button className="field-globe-back" onClick={onBackToGlobe}><MissionIcon name="chevron-left" size={16} />Globo de Marte</button>}
      <nav className="field-regions" aria-label="Mission region">
        <button aria-current={selectedRegionId === 'syrtis-major' ? 'location' : undefined} onClick={() => selectRegion('syrtis-major')}>Syrtis Major</button>
        <span aria-hidden="true">/</span>
        <button aria-current={selectedRegionId === 'jezero' ? 'location' : undefined} onClick={() => selectRegion('jezero')}>Jezero</button>
        <span aria-hidden="true">/</span>
        <button aria-current={selectedRegionId === 'wildcat-ridge' ? 'location' : undefined} onClick={() => selectRegion('wildcat-ridge')}>Wildcat Ridge</button>
      </nav>
      {!planned && <details className="field-demo">
        <summary>Mission case</summary>
        <div className="field-demo-content"><label htmlFor="mission-case">Mission case</label><select id="mission-case" value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>{demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}</select><button className="md-button md-button-outline" aria-pressed={hideData} onClick={() => { focusAfterOpen.current = null; setHideData(!hideData); setReturning(false); changePage(0); setOpenPanel(!hideData || scenarioId.includes('delay') ? 'alerts' : 'information') }}>No data</button></div>
      </details>}
      {planned && <CoordinateInspector />}
      {integrated && <div className="field-map-controls">
        <button className="field-rail-button field-map-toggle" aria-expanded={openPanel === 'map'} aria-controls="mission-map-view" onClick={() => togglePanel('map')}><MissionIcon name="layers" /><span>Map view</span></button>
        <div className="field-map-navigation-slot" ref={setMapNavigationTarget} />
      </div>}
      <div className="field-information" ref={overlayRef}>
        <MissionInfoPanel mission={mission} region={regions[selectedRegionId]} image={wildcatImage} activeTab={activeTab} page={page} contentRef={information.ref} onTabChange={changeTab} onPageChange={changePage} onReturn={() => { setReturning(true); openInformation('route') }} onInspectStop={() => selectRegion('wildcat-ridge')} collapsed={openPanel !== 'information'} />
        <MissionAlerts mission={mission} open={openPanel === 'alerts'} onOpenRoute={() => openInformation('route')} />
        {integrated && <div id="mission-map-view" ref={setMapToolsTarget} hidden={openPanel !== 'map'} />}
      </div>
      <div className="field-control-rail" role="group" aria-label="Mission panels and audio">
        <button className="field-rail-button" aria-expanded={openPanel === 'information'} aria-controls="mission-information" onClick={() => togglePanel('information')}><MissionIcon name={openPanel === 'information' ? 'panel-close' : 'panel-open'} /><span>Information</span></button>
        <button className={`field-rail-button ${mission.notice?.level === 'warning' ? 'has-warning' : ''}`} aria-expanded={openPanel === 'alerts'} aria-controls="mission-alerts" onClick={() => togglePanel('alerts')}><MissionIcon name="alert" /><span>Alerts</span>{mission.notice?.level === 'warning' && <span className="mt-alert-count" aria-label="1 mission alert">1</span>}</button>
        <VoiceControls noticeId={mission.notice?.id} text={mission.notice?.text} />
      </div>
      <span className="field-sr-only" role="status" aria-live="polite">{mission.notice?.title}</span>
      <MissionHUD mission={mission} onOpenRoute={() => openInformation('route')} onOpenTelemetry={() => openInformation('telemetry')} />
    </div>
  )
}
