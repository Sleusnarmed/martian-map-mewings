import region from "./region.json";

export default function TerrainStyleControls({ ready, state, layers, slopeThreshold, setSlopeThreshold }) {
  const { elevationColors, setElevationColors, slopesVisible, setSlopesVisible,
    contours, setContours, spacing, setSpacing } = layers;
  return (
    <>
      <label className="control-row">
        <span>Elevation colors</span>
        <input
          type="checkbox"
          checked={elevationColors}
          disabled={!ready}
          onChange={(e) => setElevationColors(e.target.checked)}
        />
      </label>
      <label className="control-row">
        <span>Regional slopes</span>
        <input
          type="checkbox"
          checked={slopesVisible}
          disabled={!ready}
          onChange={(e) => setSlopesVisible(e.target.checked)}
        />
      </label>
      <label className="control-row">
        <span>Contour lines</span>
        <input
          type="checkbox"
          checked={contours}
          disabled={!ready}
          onChange={(e) => setContours(e.target.checked)}
        />
      </label>
      <label className="control-row">
        Contour interval
        <select
          disabled={!ready || !contours}
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
        >
          <option value="50">50 m</option>
          <option value="100">100 m</option>
          <option value="250">250 m</option>
        </select>
      </label>
      {ready && elevationColors && (
        <div className="field-map-elevation">
          <p>Elevation · m, MOLA</p>
          <div
            className="elevation-ramp"
            style={{
              background: `linear-gradient(90deg, ${region.palette.join(",")})`,
            }}
          />
          <div className="legend-values">
            <span>{Math.round(state.data.minimumHeight)}</span>
            <span>{Math.round(state.data.maximumHeight)}</span>
          </div>
        </div>
      )}
      <label className="control-row">
        Slope review threshold
        <select
          value={slopeThreshold}
          onChange={(e) => setSlopeThreshold(Number(e.target.value))}
        >
          <option value="10">10°</option>
          <option value="15">15°</option>
          <option value="20">20°</option>
        </select>
      </label>
    </>
  );
}
