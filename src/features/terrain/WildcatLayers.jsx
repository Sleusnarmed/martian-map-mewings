import { useRef, useState } from 'react'
import { clockLabel } from './environmentModel'
import { geologyLayer, geologyLegend, hiriseLayer, orbitalLayer, wildcatAsset } from './wildcatImagery'
import { heatColors } from './useSolarHeatingLayer'
import { DEM_SOURCE } from './terrainData'

const MEDA_SOURCE = 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html'
const MOSAIC_SOURCE = 'https://www.jpl.nasa.gov/images/pia24928-sample-collection-and-rock-analysis-at-wildcat-ridge/'
const SKYCAM_SOURCE = 'https://pds-atmospheres.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/browse_skycam/sol/00518/ids/rdr/meda/WSM_0518_0712916049_000RAD_N0261222MEDA00000_0000LUJ02.png'

const sections = [
  ['map', 'Map'],
  ['environment', 'Environment'],
  ['photos', 'Photos'],
]

const variables = [
  { id: 'surface-temperature', title: 'Surface temperature', sensor: 'TIRS · ground brightness temperature', unit: '°C', note: 'The archive does not populate the wheel obstruction flag for these readings.' },
  { id: 'air-temperature', title: 'Air temperature', sensor: 'ATS · sensor 1', unit: '°C' },
  { id: 'pressure', title: 'Pressure', sensor: 'PS · derived product', unit: 'Pa' },
  { id: 'wind', title: 'Wind', sensor: 'WS · horizontal speed', unit: 'm/s', note: 'The sol 518 archive has no wind reading. This series is from sol 312 in Jezero.' },
  { id: 'humidity', title: 'Relative humidity', sensor: 'RHS · local relative humidity', unit: '% RH' },
  { id: 'solar', title: 'Solar radiation', sensor: 'RDS · upward photodiode 7', unit: 'W/m²', note: 'Radiation measured in the photodiode’s field of view. Ionizing dose requires a separate instrument.' },
]

function SourceLink({ href, children }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}</a>
}

function MapLayerControl({ checked, disabled, label, onChange, source, status, children }) {
  return <div className="wildcat-filter">
    <label className="control-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} disabled={disabled} />
    </label>
    <SourceLink href={source}>Source ↗</SourceLink>
    {checked && status === 'loading' && <p role="status">Loading layer…</p>}
    {checked && status === 'error' && <p role="status">Layer unavailable.</p>}
    {checked && status === 'ready' && children}
  </div>
}

function Photo({ thumbnail, file, alt, caption, source }) {
  const dialog = useRef(null)
  const [opened, setOpened] = useState(false)
  return <figure className="wildcat-photo">
    <button type="button" aria-label={'Enlarge ' + alt} onClick={() => {
      setOpened(true)
      dialog.current?.showModal()
    }}>
      <img src={wildcatAsset(thumbnail ?? file)} alt={alt} loading="lazy" />
    </button>
    <figcaption>{caption} <SourceLink href={source}>Source ↗</SourceLink></figcaption>
    <dialog ref={dialog} className="wildcat-photo-dialog" aria-label={alt} onClose={() => setOpened(false)}>
      <form method="dialog"><button>Close photo</button></form>
      {opened && <img src={wildcatAsset(file)} alt={alt} />}
    </dialog>
  </figure>
}

function Observation({ definition, data, reading, sol }) {

  return <details className="wildcat-observation">
    <summary>{definition.title}<span className="observation-summary">{reading ? `${reading.value.toFixed(1)} ${definition.unit}` : 'No sample'}</span></summary>
    <p>{definition.sensor}</p>
    {reading ? <>
      <p className="wildcat-reading">
        {reading.value.toLocaleString(undefined, { maximumFractionDigits: 3 })} {definition.unit}
        {reading.direction !== undefined && <small> · Direction {reading.direction}°</small>}
      </p>
      <p>Measured: sol {data.sol} · {reading.time} LMST<br />Offset from shared clock: {reading.offsetMinutes.toFixed(1)} min.</p>
      <SourceLink href={data.source}>PDS measurement file ↗</SourceLink>
    </> : <p>{data?.sol !== sol ? `No series for sol ${sol} in this package.` : 'No observation within 35 minutes of the shared clock. No extrapolation.'}</p>}
    {definition.note && <p>{definition.note}</p>}
  </details>
}

function Environment({ environment }) {
  const { archive: state, sol, minute, reading, retry } = environment
  const [skyOpen, setSkyOpen] = useState(false)

  return <section aria-label="Historical environment" className="wildcat-environment">
    <p>Historical measurements at Perseverance in Jezero. Hours use local mean solar time (LMST). <SourceLink href={MEDA_SOURCE}>MEDA archive ↗</SourceLink></p>
    <p><strong>Sol {sol} · {clockLabel(minute)} LMST</strong><br />All sensors follow the map clock. Nearest recorded sample within ±35 min; no interpolation. These measurements do not describe every point on the map.</p>
    {state.status === 'loading' && <p role="status">Loading MEDA observations…</p>}
    {state.status === 'error' && <p role="status">MEDA observations could not be loaded. <button onClick={retry}>Retry MEDA</button></p>}
    {state.status !== 'loading' && variables.map(definition => (
      <Observation key={definition.id} definition={definition} data={state.data?.[definition.id]} reading={reading(definition.id)} sol={sol} />
    ))}
    <label className="control-row wildcat-sky-toggle">
      <span>Dust and sky context</span>
      <input type="checkbox" checked={skyOpen} onChange={event => setSkyOpen(event.target.checked)} />
    </label>
    {skyOpen && <Photo file="skycam-sol-518.png" alt="SkyCam view of the Martian sky"
      caption="Perseverance · MEDA SkyCam · Sol 518 · NASA PDS. Visual context for dust and aerosols."
      source={SKYCAM_SOURCE} />}
  </section>
}

export default function WildcatLayers({
  terrainControls, elevationLegend, ready, orbital, geology, geologyOpacity, setGeologyOpacity, environment, heat, closeUp,
}) {
  const [section, setSection] = useState('map')

  return <>
    <div className="wildcat-layer-tabs" aria-label="Layer groups">
      {sections.map(([id, title]) => (
        <button key={id} type="button" aria-pressed={id === section} onClick={() => setSection(id)}>{title}</button>
      ))}
    </div>
    {section === 'map' && <>
      <MapLayerControl label="Colorized orbital texture" source={orbitalLayer.source}
        checked={orbital.enabled} onChange={orbital.toggle} disabled={!ready} status={orbital.status}>
        <p>CTX covers Jezero at ≈14 m/pixel with ≈5 m/pixel around Wildcat Ridge. Colors are illustrative.</p>
        {orbital.detailStatus === 'error' && <p>The 5 m CTX crop is unavailable.</p>}
        {orbital.hiriseStatus === 'loading' && <p role="status">Loading the HiRISE close-up…</p>}
        {orbital.hiriseStatus === 'error' && <p>The HiRISE close-up image is unavailable.</p>}
        <p><SourceLink href={hiriseLayer.source}>HiRISE imagery ↗</SourceLink></p>
        {closeUp && <button className="wildcat-detail-button" type="button" onClick={closeUp}>Inspect calculated route in 3D</button>}
      </MapLayerControl>
      <MapLayerControl label="Solar heat map (modeled)" source={DEM_SOURCE}
        checked={heat.enabled} onChange={heat.toggle} disabled={!ready} status={heat.status}>
        <p>Relative direct sunlight on the terrain by LMST, using an equinox model. Measured rover temperatures are in Environment.</p>
        <div className="elevation-ramp" style={{ background: `linear-gradient(90deg, ${heatColors.join(',')})` }} />
        <div className="legend-values"><span>0% · dark</span><span>100% · direct</span></div>
        <label className="wildcat-opacity">
          <span>Heat opacity · {Math.round(heat.opacity * 100)}%</span>
          <input type="range" min="0.1" max="1" step="0.05" value={heat.opacity} onChange={event => heat.setOpacity(Number(event.target.value))} />
        </label>
      </MapLayerControl>
      {terrainControls}
      {elevationLegend}
      <MapLayerControl label="Geologic units" source={geologyLayer.source}
        checked={geology.enabled} onChange={geology.toggle} disabled={!ready} status={geology.status}>
        <label className="wildcat-opacity">
          <span>Opacity · {Math.round(geologyOpacity * 100)}%</span>
          <input type="range" min="0.1" max="1" step="0.05" value={geologyOpacity} onChange={event => setGeologyOpacity(Number(event.target.value))} />
        </label>
        <p>Unmapped areas remain transparent.</p>
        <details className="wildcat-geology-legend">
          <summary>USGS legend · 1:75,000</summary>
          <ul>{geologyLegend.map(([color, title]) => <li key={title}>
            <span style={{ backgroundColor: color }} aria-hidden="true" />{title}
          </li>)}</ul>
        </details>
      </MapLayerControl>
    </>}
    {section === 'environment' && <Environment environment={environment} />}
    {section === 'photos' && <Photo file="wildcat-ridge.jpg" thumbnail="wildcat-ridge-thumb.jpg"
      alt="Mastcam-Z mosaic of the Wildcat Ridge outcrop"
      caption="Wildcat Ridge · Mastcam-Z · Sol 518 · NASA/JPL-Caltech/ASU/MSSS."
      source={MOSAIC_SOURCE} />}
  </>
}
