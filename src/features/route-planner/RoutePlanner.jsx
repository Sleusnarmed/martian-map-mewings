import { useState } from "react";
import { useRouteMission } from "./RouteMissionContext.js";
import { formatCoordinates } from "./routeGeometry.js";
import {
  formatMeters,
  formatMinutes,
} from "../mission-detail/missionPresentation.js";
import useFadingView from "../mission-detail/useFadingView.js";
import "./route-planner.css";

const pages = ["Plan", "Traverse", "Limits", "Events"];

function RouteAssessment({ result }) {
  if (!result?.route) return null;
  const limited = result.status === "resources";
  const minimum = (seconds) => `${Math.ceil(seconds / 6) / 10} min`;
  return (
    <section className="route-assessment" aria-label="Route time and resources">
      <dl className="route-readings">
        <div>
          <dt>Outbound time</dt>
          <dd>{formatMinutes(result.outboundSeconds)}</dd>
        </div>
        <div>
          <dt>Return from B</dt>
          <dd>{formatMinutes(result.returnSeconds)}</dd>
        </div>
      </dl>
      <details open={limited || undefined}>
        <summary>
          {limited ? "Resources required to start" : "Resource requirements"}
        </summary>
        <table>
          <caption className="field-sr-only">
            Total excursion resources, including time already used
          </caption>
          <thead>
            <tr>
              <th scope="col">Resource</th>
              <th scope="col">Available now</th>
              <th scope="col">Minimum total</th>
            </tr>
          </thead>
          <tbody>
            {result.resources?.map((resource) => (
              <tr
                key={resource.id}
                className={resource.shortfallSeconds > 0 ? "is-limiting" : ""}
              >
                <th scope="row">
                  {resource.label}
                  {resource.shortfallSeconds > 0 && (
                    <small>Short by {minimum(resource.shortfallSeconds)}</small>
                  )}
                </th>
                <td>{formatMinutes(resource.availableSeconds)}</td>
                <td>{minimum(resource.minimumTotalSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {limited && (
          <p className="route-status is-warning">
            Traversal locked. Update the limits and recalculate, or move B
            closer.
          </p>
        )}
        <p className="route-source-note">
          Includes {formatMinutes(result.activitySeconds)} activity,{" "}
          {formatMinutes(result.reserveSeconds)} reserve and{" "}
          {formatMinutes(result.conservativeReturnSeconds)} conservative return
          allowance.
        </p>
      </details>
    </section>
  );
}

function ManualPoint({ dispatch }) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [error, setError] = useState("");

  function assign(target) {
    const point = { latitude: Number(latitude), longitude: Number(longitude) };
    if (
      !latitude.trim() ||
      !longitude.trim() ||
      !Number.isFinite(point.latitude) ||
      !Number.isFinite(point.longitude) ||
      Math.abs(point.latitude) > 90 ||
      Math.abs(point.longitude) > 180
    ) {
      setError(
        "Enter a latitude from −90 to 90 and a longitude from −180 to 180.",
      );
      return;
    }
    setError("");
    dispatch({ type: "endpoint", target, point });
  }

  return (
    <details className="route-manual">
      <summary>Enter coordinates</summary>
      <div className="route-inputs">
        <label>
          Latitude · °N
          <input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </label>
        <label>
          Longitude · °E
          <input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </label>
      </div>
      <div className="route-actions">
        <button
          className="md-button md-button-outline"
          onClick={() => assign("a")}
        >
          Set as A
        </button>
        <button
          className="md-button md-button-outline"
          onClick={() => assign("b")}
        >
          Set as B
        </button>
      </div>
      {error && (
        <p role="alert" className="route-status">
          {error}
        </p>
      )}
    </details>
  );
}

function PlanPage({ state, dispatch, ready }) {
  const calculating = state.phase === "calculating";
  const hasRoute = Boolean(state.result?.route);
  return (
    <>
      <h2>{hasRoute ? "Route assessment" : "Plan a route"}</h2>
      {hasRoute ? (
        <RouteAssessment result={state.result} />
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

function TraversePage({ state, mission, dispatch }) {
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
      <RouteAssessment result={state.result} />
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

function EventsPage({ state, mission, dispatch }) {
  const canMove = state.phase === "ready";
  return (
    <>
      <h2>Observations & delays</h2>
      <p className="mt-panel-description">
        Nearby observations reveal terrain anomalies. Orbital terrain remains
        known.
      </p>
      <div className="route-actions">
        <button
          className="md-button md-button-outline"
          disabled={
            !canMove ||
            mission.remainingDistanceMeters < 160 ||
            state.hazards.some((h) => !h.known)
          }
          onClick={() => dispatch({ type: "obstacle-ahead" })}
        >
          Place an unobserved obstacle ahead
        </button>
      </div>
      <p className="mt-panel-description">
        {state.hazards.some((h) => !h.known)
          ? "Observation scenario armed. Continue to discover the obstacle."
          : "The obstacle location is excluded from planning until observed."}
      </p>
      <div className="route-actions">
        <button
          className="md-button md-button-outline"
          disabled={!state.result || state.phase === "calculating"}
          onClick={() => dispatch({ type: "delay", seconds: 480 })}
        >
          Add 8 min delay
        </button>
      </div>
    </>
  );
}

function LimitsPage({ state, dispatch }) {
  const locked = state.elapsed > 0;
  const inputs = [
    ["maxSlope", "Slope limit · °", 1, 35, 1, 1],
    ["pace", "Level pace · m/s", 0.1, 2, 0.1, 1],
    ["budgetSeconds", "Mission time · min", 5, 480, 1, 60],
    ["oxygenSeconds", "O₂ autonomy · min", 5, 480, 1, 60],
    ["reserveSeconds", "Return reserve · min", 1, 60, 1, 60],
    ["activitySeconds", "Activity at B · min", 0, 120, 1, 60],
  ];
  return (
    <>
      <h2>Planning limits</h2>
      <p className="mt-panel-description">
        Adjustable assumptions for this excursion.
      </p>
      <div className="route-inputs">
        {inputs.map(([id, label, min, max, step, scale]) => (
          <label key={id}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              disabled={locked}
              value={state.settings[id] / scale}
              onChange={(e) => {
                const value = e.target.valueAsNumber;
                if (Number.isFinite(value) && value >= min && value <= max) {
                  dispatch({
                    type: "settings",
                    values: { [id]: value * scale },
                  });
                }
              }}
            />
          </label>
        ))}
      </div>
      <label className="route-speed">
        Preference
        <select
          disabled={locked}
          value={state.settings.priority}
          onChange={(e) =>
            dispatch({ type: "settings", values: { priority: e.target.value } })
          }
        >
          <option value="terrain">Lower terrain exposure</option>
          <option value="distance">Shorter distance</option>
        </select>
      </label>
      <p className="route-source-note">
        {locked
          ? "Clear the route to change assumptions."
          : "Both preferences enforce terrain limits and return reserve. These values are planning assumptions."}
      </p>
    </>
  );
}

export default function RoutePlanner() {
  const { state, dispatch, terrain, mission } = useRouteMission();
  const {
    value: page,
    change: changePage,
    ref: pageRef,
  } = useFadingView("Plan");
  return (
    <div className="route-planner">
      <nav className="route-pages" aria-label="Route controls">
        {pages.map((name) => (
          <button
            key={name}
            aria-pressed={page === name}
            onClick={() => changePage(name)}
          >
            {name}
          </button>
        ))}
      </nav>
      <div ref={pageRef}>
        {page === "Plan" ? (
          <PlanPage
            state={state}
            dispatch={dispatch}
            ready={Boolean(terrain)}
          />
        ) : page === "Traverse" ? (
          <TraversePage state={state} mission={mission} dispatch={dispatch} />
        ) : page === "Limits" ? (
          <LimitsPage state={state} dispatch={dispatch} />
        ) : (
          <EventsPage state={state} mission={mission} dispatch={dispatch} />
        )}
      </div>
    </div>
  );
}
