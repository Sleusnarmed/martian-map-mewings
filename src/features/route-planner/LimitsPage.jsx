
export default function LimitsPage({ state, dispatch }) {
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
