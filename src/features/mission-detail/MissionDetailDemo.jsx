import { useState } from 'react'
import MissionHUD from './MissionHUD.jsx'
import MissionInfoPanel from './MissionInfoPanel.jsx'
import RouteMapPlaceholder from './RouteMapPlaceholder.jsx'
import { demoScenarios, missingMission, regions, wildcatImage } from './demoMission.js'
import spaceAppsLogo from './assets/space-apps-2026.svg'
import MissionIcon from './MissionIcon.jsx'
import './mission-detail.css'
import './tablet-mission.css'

export default function MissionDetailDemo() {
  const [selectedRegionId, setSelectedRegionId] = useState('wildcat-ridge')
  const [scenarioId, setScenarioId] = useState('normal')
  const [returning, setReturning] = useState(false)
  const [hideData, setHideData] = useState(false)
  const [activeTab, setActiveTab] = useState('route')
  const [page, setPage] = useState(0)
  const selectedScenario = demoScenarios.find((scenario) => scenario.id === scenarioId)
  const baseMission = hideData ? missingMission : selectedScenario
  // The shared route module will own the transition. This adapter only changes the demo snapshot.
  const mission = returning && !hideData ? {
    ...baseMission, mode: 'return', status: 'in-progress', nextWaypointName: 'Simulated base',
    remainingDistanceMeters: baseMission.returnDistanceMeters,
    notice: { ...baseMission.notice, id: `${baseMission.notice.id}-return`, title: 'Return route selected',
      text: `Return mode selected in the exercise. Follow the route back to the simulated base. ${baseMission.notice.text}` },
  } : baseMission

  function changeTab(tab) { setActiveTab(tab); setPage(0) }
  function inspectStop() { setSelectedRegionId('wildcat-ridge'); changeTab('science') }
  function selectScenario(id) {
    setScenarioId(id); setReturning(false); setHideData(false); setPage(0)
    if (id === 'arrival') { setSelectedRegionId('wildcat-ridge'); setActiveTab('science') }
    else if (id === 'delay' || id === 'seismic-delay') setActiveTab('alerts')
    else setActiveTab('route')
  }

  return (
    <div className="md-demo mt-shell">
      <a className="md-skip-link" href="#mission-information">Skip to mission information</a>
      <header className="mt-header">
        <a className="md-event-brand" href="https://www.spaceappschallenge.org/" target="_blank" rel="noreferrer"><img src={spaceAppsLogo} width="112" height="44" alt="NASA Space Apps Challenge 2026" /></a>
        <div className="mt-project-name"><strong>VISTA MARS</strong><span>Surface mission / Crew 02</span></div>
        <span className="md-tag">Tablet interface · Simulation</span>
      </header>
      <div className="mt-mission-toolbar">
        <nav className="mt-region-nav" aria-label="Mission visual sequence"><span>Syrtis Major</span><MissionIcon name="chevron" size={16} /><button aria-current={selectedRegionId === 'jezero' ? 'location' : undefined} onClick={() => { setSelectedRegionId('jezero'); changeTab('science') }}>Jezero</button><MissionIcon name="chevron" size={16} /><button aria-current={selectedRegionId === 'wildcat-ridge' ? 'location' : undefined} onClick={inspectStop}>Wildcat Ridge</button></nav>
        <div className="mt-demo-controls"><label htmlFor="exercise-scenario">Exercise</label><select id="exercise-scenario" value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>{demoScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}</select><button className="mt-data-toggle" aria-pressed={hideData} onClick={() => { setHideData(!hideData); setReturning(false); setPage(0) }}>No data</button></div>
      </div>
      <main className="mt-workspace">
        <RouteMapPlaceholder mission={mission} onInspectStop={inspectStop} onOpenRoute={() => changeTab('route')} />
        <div id="mission-information" className="mt-info-slot"><MissionInfoPanel mission={mission} region={regions[selectedRegionId]} image={wildcatImage} activeTab={activeTab} page={page} onTabChange={changeTab} onPageChange={setPage} onInspectStop={inspectStop} /></div>
      </main>
      <MissionHUD mission={mission} onReturn={() => { setReturning(true); changeTab('route') }} onOpenRoute={() => changeTab('route')} onOpenAlerts={() => changeTab('alerts')} />
    </div>
  )
}
