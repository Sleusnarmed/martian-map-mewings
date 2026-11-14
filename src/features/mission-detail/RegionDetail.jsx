import { useState } from 'react'

function SurfaceEvidence({ image }) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className="mt-evidence">
      {image?.src && !failed ? <img src={image.src} alt={image.alt} onError={() => setFailed(true)} /> : <div className="md-image-fallback">Surface image unavailable. Use the NASA source on the next page.</div>}
      {image && <figcaption><span>{image.instrument}</span><span>{image.date} · Credit: {image.credit}</span></figcaption>}
    </figure>
  )
}

export default function RegionDetail({ region, image, page = 0 }) {
  if (!region) return <><h2>Science brief</h2><p>Select Jezero or Wildcat Ridge to see its science brief.</p></>
  if (page === 1) return <div className="mt-science"><h2>Surface evidence</h2><p className="mt-panel-description">Wildcat Ridge · historical observation</p><SurfaceEvidence key={image?.src || 'missing'} image={image} /><p className="mt-body-note">This photograph is at Wildcat Ridge, within Jezero. It is not a regional map or a live view.</p></div>
  if (page === 2) return <div className="mt-science"><h2>Sources & coverage</h2><p className="mt-panel-description">Keep evidence and simulation separate.</p><dl className="mt-source-list"><div><dt>Geological context</dt><dd>{region.geology || 'No data'}</dd></div><div><dt>Image processing</dt><dd>{image?.note || 'Image information unavailable.'}</dd></div><div><dt>Route coverage</dt><dd>Coordinates and terrain coverage pending integration. Route geometry is simulated.</dd></div></dl></div>
  return <div className="mt-science"><h2>{region.name}</h2><p className="mt-panel-description">{region.eyebrow} · historical evidence</p><p className="mt-science-description">{region.description}</p><h3>Exercise objective</h3><p>{region.objective}</p></div>
}
