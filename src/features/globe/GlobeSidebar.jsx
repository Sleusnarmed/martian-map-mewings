import { MARS_REGIONS } from "../../data/marsZones";

export default function GlobeSidebar({ compact, isTransitioning, isSidebarOpen, setIsSidebarOpen, navLevel, activeRegion, focusRegionOnGlobe, onEnterZone }) {
  return <>
      {/* BOTÓN FLOTANTE PARA VOLVER A DESPLEGAR LA BARRA LATERAL CUANDO ESTÁ COLAPSADA */}
      {!compact && !isTransitioning && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-3 sm:left-5 top-18 sm:top-20 z-30 min-h-[44px] px-4 py-2.5 bg-[#07173F]/95 hover:bg-[#0042A6] active:scale-95 text-[#EAFE07] border-2 border-[#2E96F5] rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          <span>☰</span>
          <span>{navLevel === "zones" ? "Zonas" : "Regiones"}</span>
        </button>
      )}

      {/* BARRA LATERAL IZQUIERDA DESPLEGABLE: REGIONES */}
      {!compact && navLevel === "regions" && !compact && !isTransitioning && isSidebarOpen && (
        <aside className="absolute left-3 sm:left-5 top-18 sm:top-20 bottom-4 z-30 w-68 sm:w-78 bg-[#07173F]/92 backdrop-blur-md border-2 border-[#2E96F5] rounded-2xl p-3.5 shadow-2xl flex flex-col transition-all duration-200">
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#2E96F5]/30">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#EAFE07] block">
                Regiones de Marte
              </span>
              <span className="text-[11px] text-white/70">
                Toca para ubicar · Toca el pin para entrar
              </span>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              title="Ocultar barra lateral"
              className="shrink-0 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0042A6]/60 hover:bg-[#0960E1] text-white/90 hover:text-white border border-[#2E96F5]/50 text-xs font-bold transition cursor-pointer"
            >
              ‹
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {MARS_REGIONS.map((region) =>
              region.available ? (
                <button
                  key={region.id}
                  onClick={() => focusRegionOnGlobe(region)}
                  className="w-full min-h-[62px] flex items-center justify-between gap-2 text-left p-3 rounded-xl bg-[#0042A6]/85 hover:bg-[#0960E1] active:scale-[0.99] border-2 border-[#2E96F5] transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EAFE07] animate-pulse shrink-0" />
                      <span className="font-nasa-title font-bold text-sm text-white truncate">
                        {region.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/85 truncate mt-0.5">
                      {region.code} · Operativa
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg bg-[#07173F] text-[#EAFE07] border border-[#2E96F5]/60">
                    Ubicar
                  </span>
                </button>
              ) : (
                <button
                  key={region.id}
                  onClick={() => focusRegionOnGlobe(region)}
                  title="Región sin datos hiperlocales disponibles"
                  className="w-full min-h-[48px] flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl bg-slate-900/75 border border-slate-700/60 opacity-65 hover:opacity-95 transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="font-nasa-title font-bold text-xs text-slate-300 truncate">
                        {region.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {region.code}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Inactiva
                  </span>
                </button>
              ),
            )}
          </div>
        </aside>
      )}

      {/* BARRA LATERAL IZQUIERDA DESPLEGABLE: ZONAS DENTRO DE SYRTIS MAJOR */}
      {!compact && navLevel === "zones" &&
        activeRegion &&
        !compact && !isTransitioning &&
        isSidebarOpen && (
          <aside className="absolute left-3 sm:left-5 top-18 sm:top-20 z-30 w-68 sm:w-80 bg-[#07173F]/95 backdrop-blur-md border-2 border-[#2E96F5] rounded-2xl p-4 shadow-2xl transition-all duration-200">
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-3 border-b border-[#2E96F5]/30">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#EAFE07] block">
                  Zonas en {activeRegion.name}
                </span>
                <span className="text-[11px] text-white/75">
                  Toca un punto en el mapa o elige aquí:
                </span>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Ocultar barra lateral"
                className="shrink-0 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0042A6]/60 hover:bg-[#0960E1] text-white/90 hover:text-white border border-[#2E96F5]/50 text-xs font-bold transition cursor-pointer"
              >
                ‹ Ocultar
              </button>
            </div>

            <div className="space-y-2.5">
              {activeRegion.zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => onEnterZone(zone)}
                  className="w-full min-h-[64px] flex flex-col justify-center text-left p-3.5 rounded-xl bg-[#0042A6]/70 hover:bg-[#0960E1] active:scale-[0.99] border border-[#2E96F5] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-nasa-title font-bold text-sm text-white">
                      {zone.name}
                    </span>
                  </div>
                  <span className="text-xs text-white/85 mt-1">
                    {zone.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}
  </>;
}
