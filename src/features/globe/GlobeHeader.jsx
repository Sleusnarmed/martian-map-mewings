import sansiLogo from '../../assets/branding/sansi.png';
import mewingsLogo from '../../assets/branding/mewings.svg';

export default function GlobeHeader({ creditRef, compact, isTransitioning, navLevel, activeRegion, handleBackToRegions }) {
  return <>
      {/* BARRA SUPERIOR */}
        <header style={{ display: compact || isTransitioning ? "none" : undefined }} className="globe-header pointer-events-none absolute top-0 left-0 right-0 z-40 gap-3 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src={sansiLogo}
              alt="SANSI"
              width="1752"
              height="897"
              draggable="false"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <div className="hidden sm:block h-6 w-[1px] bg-[#2E96F5]/40" />
            <div className="hidden sm:block">
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

          <div className="globe-header-actions">
          {navLevel === "zones" && (
            <button
              onClick={handleBackToRegions}
              className="pointer-events-auto min-h-[42px] px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#07173F]/95 hover:bg-[#0042A6] active:scale-95 text-[#EAFE07] border border-[#2E96F5] rounded-xl transition cursor-pointer"
            >
              ← Back to regions
            </button>
          )}
          <div className="globe-brand-credits">
            <div ref={creditRef} className="globe-credits" aria-label="Map credits" />
            <img src={mewingsLogo} alt="Mewings" width="1254" height="1254" draggable="false" className="globe-mewings" />
          </div>
          </div>
        </header>

  </>;
}
