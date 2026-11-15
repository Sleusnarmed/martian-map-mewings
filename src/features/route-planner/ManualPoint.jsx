import { useState } from "react";

export default function ManualPoint({ dispatch }) {
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
