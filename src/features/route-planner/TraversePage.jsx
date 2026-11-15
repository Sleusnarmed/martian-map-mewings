import { formatMeters, formatMinutes } from "../mission-detail/missionPresentation.js";
import RouteAssessment from "./RouteAssessment.jsx";

export default function TraversePage({ state, mission, dispatch }) {
  const route = state.result?.route;
  const canMove = state.phase === "ready";
  return (
    <>
      <h2>
        {state.mode === "return" ? "Return to point A" : "Traverse to point B"}
      </h2>
      {route ? (
        <dl className="route-readings">
          <div>
            <dt>Remaining</dt>
            <dd>{formatMeters(mission.remainingDistanceMeters)}</dd>
          </div>
          <div>
            <dt>Return estimate</dt>
            <dd>{formatMinutes(mission.returnDurationSeconds)}</dd>
          </div>
        </dl>
      ) : (
        <p className="route-status">
          {state.phase === "arrived"
            ? "Destination reached."
            : state.phase === "calculating"
              ? "Checking the terrain and return resources…"
              : "Calculate a route in Plan to begin."}
        </p>
      )}
      <div className="route-actions">
        <button
          className="md-button md-button-primary"
          disabled={!canMove}
          onClick={() => dispatch({ type: "play" })}
        >
          {state.playing ? "Pause traverse" : "Start traverse"}
        </button>
        <button
          className="md-button md-button-outline"
          disabled={!canMove || state.playing}
          onClick={() => dispatch({ type: "advance", metres: 25 })}
        >
          Advance 25 m
        </button>
      </div>
      <label className="route-speed">
        Traversal playback
        <select
          value={state.rate}
          onChange={(e) =>
            dispatch({ type: "rate", rate: Number(e.target.value) })
          }
        >
          <option value="1">1×</option>
          <option value="10">10×</option>
          <option value="30">30×</option>
        </select>
      </label>
      <div className="route-actions">
        <button
          className="md-button md-button-outline"
          disabled={
            !state.position ||
            state.phase === "calculating" ||
            state.mode === "return" ||
            !state.result?.currentReturn
          }
          onClick={() => dispatch({ type: "return" })}
        >
          Return to A
        </button>
      </div>
      {state.phase === "preview" && (
        <p className="route-status is-warning" role="status">
          Route preview. Start is locked until the resource minimums are met.
        </p>
      )}
      <RouteAssessment state={state} />
      <p className="mt-body-note">Camera movement only changes your view.</p>
      {route && (
        <p className="route-source-note">
          {route.source} · {Math.round(route.gridMetres)} m grid · highest
          sampled slope {route.maxSlope.toFixed(1)}°
        </p>
      )}
    </>
  );
}
