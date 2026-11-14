import TerrainPreview from './TerrainPreview'
import './terrain.css'

export default function TerrainLoadingScreen({ onImageReady, error }) {
  return <main className="terrain-app">
    <header className="terrain-header"><div className="project-signature"><strong>MARTIAN MAP</strong><span>Space Apps Challenge · 2026</span></div><div><p className="eyebrow">Mars / Terrain explorer</p><h1>Jezero</h1></div><span className="mode-tag">Regional cartography</span></header>
    <div className="terrain-workspace">
      <aside className="terrain-panel"><div className="panel-intro-block"><p className="eyebrow">Explore the surface</p><h2>Your view of Jezero.</h2><p className="panel-intro">The lightweight map is ready to explore. Detailed relief loads in the background.</p><p className="panel-intro">Drag to pan. Use + and − to zoom.</p></div><details className="source-card"><summary>Data & sources</summary><p>Shaded relief derived from NASA / JPL / USGS CTX elevation data.</p><p>The cyan arrow is a mock position, not live tracking.</p></details></aside>
      <section className="map-shell" aria-label="Jezero 2D preview"><TerrainPreview onImageReady={onImageReady} error={error}/><footer className="map-footer"><span>Syrtis Major / Jezero crater</span><span>Fast 2D preview</span></footer></section>
    </div>
  </main>
}
