import { clockLabel, LAST_MINUTE } from './environmentModel'

export default function EnvironmentTimeline({ environment }) {
  const { sol, minute, playing, archive, seek, chooseSol, toggle, reading } = environment
  const air = reading('air-temperature'), solar = reading('solar')
  return <section className="environment-timeline" aria-label="Shared historical clock">
    <div className="timeline-heading"><strong>MEDA · historical replay</strong><span>{clockLabel(minute)} LMST</span></div>
    <div className="timeline-controls">
      <button onClick={toggle} disabled={archive.status !== 'ready'} aria-label={playing ? 'Pause historical replay' : 'Play historical replay'}>{playing ? 'Ⅱ Pause' : '▶ Play'}</button>
      <label><span className="sr-only">Historical sol</span><select value={sol} onChange={e => chooseSol(Number(e.target.value))}><option value="518">Sol 518</option><option value="312">Sol 312 · wind</option></select></label>
      <label className="timeline-slider"><span className="sr-only">Shared LMST time</span><input type="range" min="0" max={LAST_MINUTE} step="5" value={minute} aria-valuetext={`${clockLabel(minute)} LMST`} onChange={e => seek(Number(e.target.value))} /></label>
    </div>
    <p>Air {air ? `${air.value.toFixed(1)} °C` : '—'} <span>Solar {solar ? `${solar.value.toFixed(0)} W/m²` : '—'}</span></p>
    <small>{playing ? '5 LMST minutes / second' : 'One clock for all sensors'} · sampled archive, not live</small>
  </section>
}
