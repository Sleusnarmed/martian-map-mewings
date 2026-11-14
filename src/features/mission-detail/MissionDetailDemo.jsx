import { useState } from 'react'
import MissionHUD from './MissionHUD.jsx'
import MissionInfoPanel from './MissionInfoPanel.jsx'
import RouteMapPlaceholder from './RouteMapPlaceholder.jsx'
import { demoScenarios, missingMission, regions, wildcatImage } from './demoMission.js'
import MissionIcon from './MissionIcon.jsx'
import './mission-detail.css'
import './tablet-mission.css'

// Optional review links initialize a fixture without changing the normal open-panel demo.
function readPreviewLocation() {
  const query = new URLSearchParams(window.location.search)
  const scenarioId = demoScenarios.some((scenario) => scenario.id === query.get('scenario')) ? query.get('scenario') : 'normal'
  const fallbackTab = scenarioId === 'arrival' ? 'science' : scenarioId === 'normal' ? 'route' : 'alerts'
  const activeTab = ['route', 'science', 'telemetry', 'alerts'].includes(query.get('tab')) ? query.get('tab') : fallbackTab
  const lastPage = activeTab === 'science' ? 2 : 1
  const requestedPage = Number(query.get('page') || 0)
  const page = Number.isInteger(requestedPage) ? Math.max(0, Math.min(lastPage, requestedPage)) : 0
  return { scenarioId, activeTab, page, panelOpen: query.get('panel') !== 'closed' }
}

export default function MissionDetailDemo() {
  const [preview] = useState(readPreviewLocation)
  const [selectedRegionId, setSelectedRegionId] = useState('wildcat-ridge')
  const [scenarioId, setScenarioId] = useState(preview.scenarioId)
  const [returning, setReturning] = useState(false)
  const [hideData, setHideData] = useState(false)
  const [activeTab, setActiveTab] = useState(preview.activeTab)
  const [page, setPage] = useState(preview.page)
  const [panelOpen, setPanelOpen] = useState(preview.panelOpen)
  const selectedScenario = demoScenarios.find((scenario) => scenario.id === scenarioId)
  const baseMission = hideData ? missingMission : selectedScenario
  // Demo adapter only: no telemetry stream or navigation hardware is connected.
  const mission = returning && !hideData ? {
    ...baseMission, mode: 'return', status: 'in-progress', nextWaypointName: 'Simulated base',
    remainingDistanceMeters: baseMission.returnDistanceMeters,
    notice: { ...baseMission.notice, id: `${baseMission.notice.id}-return`, title: 'Return route selected',
      text: `Return mode selected in the exercise. Follow the route back to the simulated base. ${baseMission.notice.text}` },
  } : baseMission

  function changeTab(tab) { setActiveTab(tab); setPage(0) }
  function openInformation(tab) { changeTab(tab); setPanelOpen(true) }
  function selectRegion(id) { setSelectedRegionId(id); openInformation('science') }
  function selectScenario(id) {
    setScenarioId(id); setReturning(false); setHideData(false); setPage(0); setPanelOpen(true)
    if (id === 'arrival') { setSelectedRegionId('wildcat-ridge'); setActiveTab('science') }
    else setActiveTab(id === 'normal' ? 'route' : 'alerts')
  }

  return (
    <div className="md-demo field-shell">
      <a className="md-skip-link" href="#map-viewport">Skip to map</a>
      <RouteMapPlaceholder />
      <nav className="field-regions" aria-label="Mission region">
        <button aria-current={selectedRegionId === 'syrtis-major' ? 'location' : undefined} onClick={() => selectRegion('syrtis-major')}>Syrtis Major</button>
        <span aria-hidden="true">/</span>
        <button aria-current={selectedRegionId === 'jezero' ? 'location' : undefined} onClick={() => selectRegion('jezero')}>Jezero</button>
        <span aria-hidden="true">/</span>
        <button aria-current={selectedRegionId === 'wildcat-ridge' ? 'location' : undefined} onClick={() => selectRegion('wildcat-ridge')}>Wildcat Ridge</button>
      </nav>
      <details className="field-demo">
        <summary>Simulation</summary>
        <div className="field-demo-content"><label htmlFor="exercise-scenario">Exercise scenario</label><select id="exercise-scenario" value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>{demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}</select><button className="md-button md-button-outline" aria-pressed={hideData} onClick={() => { setHideData(!hideData); setReturning(false); setPage(0) }}>No data</button><p>Static test inputs. No suit sensors connected.</p></div>
      </details>
      <div className={`field-information ${panelOpen ? 'is-open' : 'is-collapsed'}`}>
        <MissionInfoPanel mission={mission} region={regions[selectedRegionId]} image={wildcatImage} activeTab={activeTab} page={page} onTabChange={changeTab} onPageChange={setPage} onInspectStop={() => selectRegion('wildcat-ridge')} collapsed={!panelOpen} />
        <button className="field-panel-toggle" aria-expanded={panelOpen} aria-controls="mission-information" aria-label={panelOpen ? 'Hide information panel' : 'Show information panel'} title={panelOpen ? 'Hide information panel' : 'Show information panel'} onClick={() => setPanelOpen(!panelOpen)}><MissionIcon name={panelOpen ? 'panel-close' : 'panel-open'} />{!panelOpen && <span>Information</span>}</button>
      </div>
      <MissionHUD mission={mission} onReturn={() => { setReturning(true); openInformation('route') }} onOpenRoute={() => openInformation('route')} onOpenAlerts={() => openInformation('alerts')} />
    </div>
  )
}
