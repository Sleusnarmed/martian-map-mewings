
export default function EventsPage({ state, mission, dispatch }) {
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
