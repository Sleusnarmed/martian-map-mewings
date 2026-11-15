
export default function GlobeInspector({ inspectedItem, compact, isTransitioning, tooltipPos }) {
  return <>
      {/* TARJETA FLOTANTE (ACTIVA O BLOQUEADA) */}
      {inspectedItem && !compact && !isTransitioning && tooltipPos && (
        <div
          style={{
            left: `${Math.min(Math.max(tooltipPos.x + 16, 16), window.innerWidth - 304)}px`,
            top: `${Math.min(Math.max(tooltipPos.y - 20, 72), window.innerHeight - 240)}px`,
          }}
          className={`pointer-events-none absolute z-50 w-72 backdrop-blur-md border-2 rounded-xl p-4 text-white shadow-2xl ${
            inspectedItem.type === "region" && !inspectedItem.available
              ? "bg-slate-950/95 border-slate-500/70"
              : "bg-[#07173F]/95 border-[#2E96F5]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                inspectedItem.type === "region" && !inspectedItem.available
                  ? "bg-slate-800 text-slate-300"
                  : "bg-[#0042A6] text-[#EAFE07]"
              }`}
            >
              {inspectedItem.type === "region"
                ? inspectedItem.code
                : "POINT OF INTEREST"}
            </span>
            <span className="text-[11px] font-mono text-white/75">
              {inspectedItem.lat.toFixed(2)}°N, {inspectedItem.lon.toFixed(2)}°E
            </span>
          </div>

          <h3 className="font-nasa-title font-black text-base tracking-wide mt-2 text-white">
            {inspectedItem.name}
          </h3>

          <p
            className={`text-xs font-bold mt-0.5 ${
              inspectedItem.type === "region" && !inspectedItem.available
                ? "text-slate-400"
                : "text-[#2E96F5]"
            }`}
          >
            {inspectedItem.subtitle}
          </p>

          <p className="text-xs text-white/85 mt-2 leading-relaxed">
            {inspectedItem.summary}
          </p>

          <div
            className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
              inspectedItem.type === "region" && !inspectedItem.available
                ? "border-slate-700 text-slate-400"
                : "border-[#2E96F5]/30 text-[#EAFE07]"
            }`}
          >
            <span>
              {inspectedItem.type === "region" && !inspectedItem.available
                ? "No local data available yet"
                : inspectedItem.type === "region"
                  ? "Tap this point to show subregions"
                  : "Tap this point to open the tactical map"}
            </span>
            <span>
              {inspectedItem.type === "region" && !inspectedItem.available
                ? "🔒"
                : "→"}
            </span>
          </div>
        </div>
      )}

  </>;
}
