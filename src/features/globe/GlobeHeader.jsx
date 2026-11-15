import spaceAppsLogo from "../../NASA Space Apps Logos - 2026/Space Apps White small logo.png";

export default function GlobeHeader({ compact, isTransitioning, navLevel, activeRegion, handleBackToRegions }) {
  return <>
      {/* BARRA SUPERIOR */}
      {!compact && !isTransitioning && (
        <header className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src={spaceAppsLogo}
              alt="NASA Space Apps Challenge"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="h-6 w-[1px] bg-[#2E96F5]/40" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#EAFE07] block">
                VISTA MARS · PLANET MARS
              </span>
              <span className="text-xs text-white/85">
                {navLevel === "zones" && activeRegion
                  ? `Region: ${activeRegion.name}`
                  : "Orbital region selection"}
              </span>
            </div>
          </div>

          {navLevel === "zones" && (
            <button
              onClick={handleBackToRegions}
              className="pointer-events-auto min-h-[42px] px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#07173F]/95 hover:bg-[#0042A6] active:scale-95 text-[#EAFE07] border border-[#2E96F5] rounded-xl transition cursor-pointer"
            >
              ← Back to regions
            </button>
          )}
        </header>
      )}

  </>;
}
