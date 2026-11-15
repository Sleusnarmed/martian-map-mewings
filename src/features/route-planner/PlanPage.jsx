import { formatCoordinates } from "./routeGeometry.js";
import RouteAssessment from "./RouteAssessment.jsx";
import ManualPoint from "./ManualPoint.jsx";

export default function PlanPage({ state, dispatch, ready }) {
  const calculating = state.phase === "calculating";
  const hasRoute = Boolean(state.result?.route);
  return (
    <>
      <h2>{hasRoute ? "Route assessment" : "Plan a route"}</h2>
      {hasRoute ? (
        <RouteAssessment state={state} />
      ) : (
        <p className="mt-panel-description">
          Select two points on the map. Routes stay within 6 km.
        </p>
      )}
      <details
        className={`route-plan-points${hasRoute ? " has-result" : ""}`}
        open={!hasRoute || undefined}
      >
        <summary>
          {hasRoute ? "Edit endpoints / recalculate" : "Start and destination"}
        </summary>
        <div className="route-endpoints">
          {["a", "b"].map((id, i) => (
            <button
              key={id}
              className="route-endpoint"
              disabled={!ready}
              aria-pressed={state.pickTarget === id}
              onClick={() =>
                dispatch({
                  type: "pick",
                  target: state.pickTarget === id ? null : id,
                })
              }
            >
              <span className="route-letter">{id.toUpperCase()}</span>
              <span>
                <strong>{i ? "Destination" : "Start / return point"}</strong>
                <small>
                  {state[id]
                    ? formatCoordinates(state[id])
                    : "Tap to select on map"}
                </small>
              </span>
            </button>
          ))}
        </div>
        <div className="route-actions">
          <button
            className="md-button md-button-primary"
            disabled={!ready || !state.a || !state.b || calculating}
            onClick={() => dispatch({ type: "plan" })}
          >
            {calculating
              ? "Calculating…"
              : state.result
                ? "Recalculate"
                : "Calculate route"}
          </button>
          <button
            className="md-button md-button-quiet"
            disabled={!state.a && !state.b}
            onClick={() => dispatch({ type: "reset" })}
          >
            Clear route
          </button>
        </div>
        {state.result && (
          <p
            className={`route-status ${["blocked", "preview"].includes(state.phase) ? "is-warning" : ""}`}
            role="status"
          >
            {state.result.message ?? state.result.explanation}
          </p>
        )}
        <ManualPoint dispatch={dispatch} />
      </details>
    </>
  );
}
