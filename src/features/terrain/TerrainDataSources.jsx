import { DEM_SOURCE } from "./terrainData";
import { hiriseLayer, geologyLayer } from "./wildcatImagery";
import { formatCoordinates } from "../route-planner/routeGeometry.js";
import SourceReference from '../../components/SourceReference.jsx';

export default function TerrainDataSources({ inspection, wildcat, points = [], onSelectPoint, selectedId, ready }) {
  return <>
    <output className="field-map-inspection">
      {inspection?.error ??
        (inspection
          ? `${formatCoordinates(inspection)} · ${inspection.elevation?.toFixed(0) ?? "—"} m`
          : "Tap terrain or a reference to inspect its coordinates.")}
    </output>
    <details className="field-science-points">
      <summary>Science points · {points.length}</summary>
      <p>Crater floor, delta front, upper fan and western margin. Select a site to locate it; tap overlapping symbols to zoom closer.</p>
      <ul>{points.map(point => <li key={point.id}><button type="button" disabled={!ready} onClick={() => onSelectPoint(point)} aria-pressed={selectedId === point.id}>{point.name}{point.campaign && <small>{point.campaign}</small>}</button></li>)}</ul>
    </details>
    <details className="field-map-sources">
      <summary>Data & sources</summary>
      <p>
        MRO · CTX / NASA / JPL / USGS
        <br />
        Regional CTX DEM: 20 m source
        <br />
        Wildcat HiRISE: 1 m source, 3 m display
        <br />
        Vertical reference: MOLA
      </p>
      <SourceReference source={DEM_SOURCE}>
        Source dataset
      </SourceReference>
      {wildcat && (
        <SourceReference source={wildcat.source} citation={wildcat.reference}>
          Wildcat Ridge position
        </SourceReference>
      )}
      <SourceReference source={hiriseLayer.source}>
        HiRISE imagery
      </SourceReference>
      <SourceReference
        source="https://doi.org/10.5066/P9REJ9JN"
      >
        HiRISE elevation
      </SourceReference>
      <SourceReference source={geologyLayer.source}>
        Geology source
      </SourceReference>
      <p>
        Routes use elevation, slope, reported obstacles and explicit resource
        assumptions. Geology and MEDA remain context layers. Solar shading is
        a relative model, not measured temperature.
      </p>
    </details>
  </>;
}
