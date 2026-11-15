import { useRouteMission } from "./RouteMissionContext.js";
import { formatCoordinates } from "./routeGeometry.js";

export default function CoordinateInspector() {
  const { state, dispatch, terrain } = useRouteMission();
  const point = state.inspection;
  if (!point && !state.pickTarget) return null;

  const ready = Boolean(terrain);
  const calculating = state.phase === "calculating";
  const canCalculate =
    ready && Boolean(state.a) && Boolean(state.b) && !calculating;

  return (
    <section
      className="coordinate-inspector"
      aria-label="Selected map coordinates"
    >
      <div className="coordinate-heading">
        <strong>
          {state.pickTarget
            ? `Select point ${state.pickTarget.toUpperCase()}`
            : (point?.name ?? "Selected point")}
        </strong>
        <button
          aria-label="Close coordinate inspector"
          onClick={() => {
            dispatch({ type: "dismiss-inspection" });
            dispatch({ type: "pick", target: null });
          }}
        >
          Close
        </button>
      </div>

      {!point ? (
        <p role="status">Tap a location or a reference on the map.</p>
      ) : point.error ? (
        <p role="status">{point.error}</p>
      ) : (
        <>
          <output aria-live="polite">{formatCoordinates(point)}</output>
          <p>
            {Number.isFinite(point.elevation)
              ? `${Math.round(point.elevation)} m · MOLA elevation`
              : "Elevation checked when calculating"}
          </p>

          <div className="route-actions">
            <button
              aria-pressed={
                state.a?.latitude === point.latitude &&
                state.a?.longitude === point.longitude
              }
              onClick={() => dispatch({ type: "endpoint", target: "a", point })}
            >
              Use as A
            </button>
            <button
              aria-pressed={
                state.b?.latitude === point.latitude &&
                state.b?.longitude === point.longitude
              }
              onClick={() => dispatch({ type: "endpoint", target: "b", point })}
            >
              Use as B
            </button>
          </div>

          <div className="route-actions">
            <button
              className="md-button md-button-primary"
              disabled={!canCalculate}
              onClick={() => {
                dispatch({ type: "plan" });
                dispatch({ type: "dismiss-inspection" });
              }}
            >
              {calculating
                ? "Calculating…"
                : state.result
                  ? "Recalculate"
                  : "Calculate route"}
            </button>
            {(state.a || state.b) && (
              <button
                className="md-button md-button-quiet"
                onClick={() => dispatch({ type: "reset" })}
              >
                Clear route
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
