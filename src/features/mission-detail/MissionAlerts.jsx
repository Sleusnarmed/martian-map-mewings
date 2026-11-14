import MissionIcon from './MissionIcon.jsx'

export default function MissionAlerts({ mission, open, onOpenRoute }) {
  const notice = mission.notice
  const warning = notice?.level === 'warning'
  return (
    <aside id="mission-alerts" className={`md-panel field-alerts ${warning ? 'is-warning' : ''}`} aria-label="Mission alerts" hidden={!open}>
      <div className="field-alert-content">
        <div className="field-alert-title"><MissionIcon name="alert" size={22} /><h2>{notice?.title || 'No current notice'}</h2></div>
        <p className="mt-full-notice">{notice?.text || 'No notice data available.'}</p>
        <p className="mt-body-note">Review time and oxygen margins against the required reserve.</p>
        <button className="md-button md-button-outline" onClick={onOpenRoute}>Review route<MissionIcon name="chevron" size={16} /></button>
      </div>
    </aside>
  )
}
