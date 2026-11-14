import { useState } from "react";
import MarsGlobe3D from "./components/MarsGlobe3D";

export default function App() {
  const [selectedZone, setSelectedZone] = useState(null);

  if (selectedZone) {
    return (
      <div className="w-full h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-xs uppercase tracking-widest text-orange-400">
          Aquí va el mapa local de Gerardo
        </p>
        <h2 className="text-3xl font-bold mt-2">{selectedZone.name}</h2>
        <p className="text-slate-400 mt-1">
          Lat: {selectedZone.lat} · Lon: {selectedZone.lon}
        </p>
        <button
          onClick={() => setSelectedZone(null)}
          className="mt-6 px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm cursor-pointer"
        >
          ← Volver al globo de Marte
        </button>
      </div>
    );
  }

  return <MarsGlobe3D onZoneSelected={(zone) => setSelectedZone(zone)} />;
}
