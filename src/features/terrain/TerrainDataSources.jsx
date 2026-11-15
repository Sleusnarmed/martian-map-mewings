import { DEM_SOURCE } from "./terrainData";
import { hiriseLayer, geologyLayer } from "./wildcatImagery";
import { formatCoordinates } from "../route-planner/routeGeometry.js";

export default function TerrainDataSources({ inspection, wildcat }) {
  return <>
    <output className="field-map-inspection">
      {inspection?.error ??
        (inspection
          ? `${formatCoordinates(inspection)} · ${inspection.elevation?.toFixed(0) ?? "—"} m`
          : "Tap terrain or a reference to inspect its coordinates.")}
    </output>
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
      <a href={DEM_SOURCE} target="_blank" rel="noreferrer">
        Source dataset
      </a>
      {wildcat && (
        <a href={wildcat.source} target="_blank" rel="noreferrer">
          Wildcat Ridge position
        </a>
      )}
      <a href={hiriseLayer.source} target="_blank" rel="noreferrer">
        HiRISE imagery
      </a>
      <a
        href="https://doi.org/10.5066/P9REJ9JN"
        target="_blank"
        rel="noreferrer"
      >
        HiRISE elevation
      </a>
      <a href={geologyLayer.source} target="_blank" rel="noreferrer">
        Geology source
      </a>
      <p>
        Routes use elevation, slope, reported obstacles and explicit resource
        assumptions. Geology and MEDA remain context layers. Solar shading is
        a relative model, not measured temperature.
      </p>
    </details>
  </>;
}
