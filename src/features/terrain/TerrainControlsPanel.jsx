import TerrainStyleControls from "./TerrainStyleControls.jsx";
import TerrainDataSources from "./TerrainDataSources.jsx";
import region from "./region.json";
import TerrainNavigation from "./TerrainNavigation";
import EnvironmentTimeline from "./EnvironmentTimeline";
import WildcatLayers from "./WildcatLayers";
import MarsSkyChart from "../mars-sky/MarsSkyChart";

export default function TerrainControlsPanel({ map, exploration, layers, skyPanel }) {
  const { ready, refining, state, focus, wildcat, onPointSelect, inspection } =
    map;
  const {
    navigation,
    slopeThreshold,
    setSlopeThreshold,
    routeVisible,
    setRouteVisible,
    route,
    environment,
    hazardsVisible,
    setHazardsVisible,
    coverageVisible,
    setCoverageVisible,
  } = exploration;
  const {
    slopeStatus,
    orbital,
    orbitalDetail,
    hirise,
    heatVisible,
    setHeatVisible,
    heatOpacity,
    setHeatOpacity,
    heatStatus,
    orbitalVisible,
    setOrbitalVisible,
    geologyVisible,
    setGeologyVisible,
    geology,
    geologyOpacity,
    setGeologyOpacity,
  } = layers;
  const observer = navigation.context?.outside ? null : navigation.context;
  const fallback = wildcat ?? region.center;
  return (
    <aside
      className="md-panel field-map-panel"
      aria-label="Map view and layers"
    >
      <h2>Map view</h2>
      <p className="mt-panel-description" role="status">
        {ready
          ? refining
            ? "Refining terrain…"
            : "Jezero · true-scale relief"
          : state.status === "error"
            ? "Map unavailable"
            : "Loading terrain…"}
      </p>
      <div className="field-map-actions">
        <button
          className="md-button md-button-outline"
          disabled={!ready}
          onClick={() => {
            focus(region.center.longitude, region.center.latitude, 75000);
            onPointSelect?.("jezero");
          }}
        >
          Jezero
        </button>
        <button
          className="md-button md-button-outline"
          disabled={!wildcat}
          onClick={() => {
            focus(wildcat.longitude, wildcat.latitude, 3500);
            onPointSelect?.("wildcat-ridge");
          }}
        >
          Wildcat Ridge
        </button>
      </div>
      <div className="field-explorer-tools">
        <section className="mars-sky-workspace">
          <button
            type="button"
            className="md-button md-button-outline"
            disabled={!ready}
            aria-expanded={skyPanel.open}
            aria-controls="mission-sky-chart"
            onClick={() => skyPanel.setOpen(!skyPanel.open)}
          >
            Cielo de Marte
          </button>
          <div id="mission-sky-chart" hidden={!skyPanel.open}>
            {skyPanel.open && <>
              <EnvironmentTimeline environment={environment} />
              <MarsSkyChart
                sky={skyPanel.sky}
                longitude={observer?.lon ?? fallback.longitude}
                latitude={observer?.lat ?? fallback.latitude}
                heading={observer?.heading ?? 0}
              />
            </>}
          </div>
        </section>
        {ready && (
          <TerrainNavigation
            navigation={navigation}
            slopes={slopeStatus === "ready"}
            orbitalReady={orbital.status === "ready"}
            ctxDetailReady={orbitalDetail.status === "ready"}
            hiriseReady={hirise.status === "ready"}
            threshold={slopeThreshold}
          />
        )}
        <label className="control-row">
          <span>Calculated route</span>
          <input
            type="checkbox"
            disabled={!ready}
            checked={routeVisible}
            onChange={(e) => setRouteVisible(e.target.checked)}
          />
        </label>
        <label className="control-row">
          <span>Known blocked areas</span>
          <input
            type="checkbox"
            disabled={!ready}
            checked={hazardsVisible}
            onChange={(e) => setHazardsVisible(e.target.checked)}
          />
        </label>
        <label className="control-row">
          <span>Unobserved ground shading</span>
          <input
            type="checkbox"
            disabled={!ready}
            checked={coverageVisible}
            onChange={(e) => setCoverageVisible(e.target.checked)}
          />
        </label>
        <p className="route-map-key">
          Shading marks ground not yet observed nearby. Hiding a layer never
          disables planning constraints.
        </p>
        <WildcatLayers
          ready={ready}
          environment={environment}
          closeUp={
            route
              ? () => {
                  navigation.startRoute();
                }
              : null
          }
          heat={{
            enabled: heatVisible,
            toggle: setHeatVisible,
            opacity: heatOpacity,
            setOpacity: setHeatOpacity,
            status: heatStatus,
          }}
          orbital={{
            enabled: orbitalVisible,
            toggle: setOrbitalVisible,
            status: orbital.status,
            detailStatus: orbitalDetail.status,
            hiriseStatus: hirise.status,
          }}
          geology={{
            enabled: geologyVisible,
            toggle: setGeologyVisible,
            status: geology.status,
          }}
          geologyOpacity={geologyOpacity}
          setGeologyOpacity={setGeologyOpacity}
          terrainControls={
            <TerrainStyleControls ready={ready} state={state} layers={layers}
              slopeThreshold={slopeThreshold} setSlopeThreshold={setSlopeThreshold} />
          }
        />
        {!skyPanel.open && <EnvironmentTimeline environment={environment} />}
      </div>
      <TerrainDataSources ready={ready} inspection={inspection} wildcat={wildcat} points={map.pointsOfInterest} selectedId={map.selectedScienceId} onSelectPoint={map.selectSciencePoint} />
    </aside>
  );
}
