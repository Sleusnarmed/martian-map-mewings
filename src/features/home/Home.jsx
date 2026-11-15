import { lazy, Suspense, useState } from 'react';
import './home.css';
import SpaceLoader from '../../components/SpaceLoader';
const MarsGlobe = lazy(() => import('../../components/MarsGlobe3D'));

import spaceApps from '../../NASA Space Apps Logos - 2026/Space Apps Logo Color and White.svg';
import orbits from '../../Patterns/Orbits.png';
const ASSETS = {spaceApps, orbits};

const WORLDS = [
  { number: '01', name: 'Mercurio', system: 'PLANETA ROCOSO', style: 'mercury', description: 'El planeta más cercano al Sol.', image: '/assets/planets/mercury.jpg', source: 'https://science.nasa.gov/solar-system/mercury/' },
  { number: '02', name: 'Venus', system: 'PLANETA ROCOSO', style: 'venus', description: 'Un mundo envuelto en densas nubes.', image: '/assets/planets/venus.jpg', source: 'https://science.nasa.gov/solar-system/venus/' },
  { number: '03', name: 'Tierra', system: 'PLANETA ROCOSO', style: 'earth', description: 'Nuestro hogar en el cosmos.', image: '/assets/planets/earth.jpg', source: 'https://science.nasa.gov/earth/' },
  { number: '04', name: 'Marte', system: 'PLANETA ROCOSO', style: 'mars', description: 'El planeta rojo.', image: '/assets/planets/mars.jpg', source: 'https://science.nasa.gov/solar-system/mars/' },
  { number: '05', name: 'Júpiter', system: 'GIGANTE GASEOSO', style: 'jupiter', description: 'El gigante del sistema solar.', image: '/assets/planets/jupiter.jpg', source: 'https://science.nasa.gov/solar-system/jupiter/' },
  { number: '06', name: 'Saturno', system: 'GIGANTE GASEOSO', style: 'saturn', description: 'Un gigante rodeado de anillos.', image: '/assets/planets/saturn.jpg', source: 'https://science.nasa.gov/solar-system/saturn/' },
  { number: '07', name: 'Urano', system: 'GIGANTE HELADO', style: 'uranus', description: 'Un mundo de hielo y tonos azulados.', image: '/assets/planets/uranus.jpg', source: 'https://science.nasa.gov/solar-system/uranus/' },
  { number: '08', name: 'Neptuno', system: 'GIGANTE HELADO', style: 'neptune', description: 'Un planeta de vientos extremos.', image: '/assets/planets/neptune.jpg', source: 'https://science.nasa.gov/solar-system/neptune/' },
];

function App({ onZoneSelected, expanded = false, onExpandedChange }) {
  const onMarsSelected = () => onExpandedChange?.(true);
  const [worldIndex, setWorldIndex] = useState(3);
  const [modalOpen, setModalOpen] = useState(false);
  const world = WORLDS[worldIndex];
  const previousWorld = WORLDS[(worldIndex - 1 + WORLDS.length) % WORLDS.length];
  const nextWorld = WORLDS[(worldIndex + 1) % WORLDS.length];

  const moveWorld = (direction) => {
    setWorldIndex((current) => (current + direction + WORLDS.length) % WORLDS.length);
  };

  if (expanded) return <main className="home-globe home-globe-expanded">
    <div className="globe-starfield" aria-hidden="true" />
    <Suspense fallback={<SpaceLoader />}><MarsGlobe onZoneSelected={onZoneSelected} /></Suspense>
    <button className="globe-home-back" onClick={() => onExpandedChange?.(false)}>← Sistema solar</button>
  </main>;

  return (
    <div className="cosmic-canvas relative flex min-h-screen flex-col justify-between overflow-x-hidden text-white selection:bg-[#e6ff00] selection:text-[#081326]">
      <div className="stars-layer pointer-events-none fixed inset-0 z-0" />
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.14] mix-blend-screen">
        <img alt="Trazos orbitales" className="h-full w-full object-cover" src={ASSETS.orbits} />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-[1520px] flex-1 flex-col justify-between px-6 py-10 sm:px-12 sm:py-14 lg:px-20">
        <div className="my-auto grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-6">
          <section className="flex h-full flex-col justify-between space-y-12 py-4 lg:col-span-5 lg:space-y-0 lg:py-8">
            <div className="space-y-6 pt-4">
              <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-neon-lime sm:text-sm">NASA SPACE APPS CHALLENGE</p>
              <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl xl:text-7xl">Martian<br />Map</h1>
              <div className="mt-4 h-1 w-12 rounded-full bg-neon-lime" />
              <p className="pt-1 text-lg font-normal tracking-wide text-text-light-blue sm:text-xl">Explora Marte. Descubre Jezero.</p>
            </div>

            <div className="pb-2 pt-8 lg:pt-16">
              <div className="flex items-center gap-6 sm:gap-8">
                <a href="https://www.spaceappschallenge.org/" target="_blank" rel="noopener noreferrer" aria-label="Visitar NASA Space Apps Challenge" className="flex h-20 items-center sm:h-24">
                  <img alt="NASA Space Apps Challenge" className="h-16 w-auto object-contain opacity-95 transition duration-300 hover:scale-105 hover:opacity-100 sm:h-20" src={ASSETS.spaceApps} />
                </a>

              </div>
            </div>
          </section>

          <section className="relative flex flex-col items-center justify-center py-4 lg:col-span-7">
            <div className="mb-2 flex w-full max-w-[480px] items-start justify-between px-2 sm:mb-4 sm:px-6">
              <PlanetBadge world={previousWorld} onClick={() => moveWorld(-1)} />
              <PlanetBadge world={nextWorld} onClick={() => moveWorld(1)} />
            </div>

            <div className="relative flex w-full items-center justify-center">
              <button aria-label="Planeta anterior" onClick={() => moveWorld(-1)} className="orbital-arrow absolute left-0 z-20 sm:left-4"><span className="material-symbols-outlined text-[26px]">chevron_left</span></button>
              <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80 md:h-96 md:w-96 lg:h-[420px] lg:w-[420px]">
                {world.style === 'mars' ? <div className="home-globe">
                  <Suspense fallback={<SpaceLoader />}><MarsGlobe onZoneSelected={onZoneSelected} compact /></Suspense>
                  <button className="globe-expand-hit" aria-label="Explorar Marte" onClick={onMarsSelected} />
                </div> : <>
                <div key={world.style} className={`planet-glow planet-${world.style} relative h-full w-full select-none overflow-hidden rounded-full`} role={world.style === 'mars' ? 'button' : 'img'} tabIndex={world.style === 'mars' ? 0 : undefined} onClick={() => { if (world.style === 'mars') onMarsSelected?.() }} onKeyDown={event => { if (world.style === 'mars' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onMarsSelected?.() } }} aria-label={world.style === 'mars' ? 'Explorar Marte' : `Vista de ${world.name}`}>
                  <div className="planet-surface" />
                  <img
                    src={world.image}
                    alt={`${world.name}, fotografía publicada por NASA`}
                    className={`absolute inset-0 z-[1] h-full w-full ${world.style === 'saturn' ? 'object-contain' : 'object-cover'}`}
                    loading="eager"
                    draggable="false"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      console.warn(`No se pudo cargar la imagen NASA de ${world.name}; se mostrará el planeta de respaldo.`);
                    }}
                  />
                </div></>}

              </div>
              <button aria-label="Planeta siguiente" onClick={() => moveWorld(1)} className="orbital-arrow absolute right-0 z-20 sm:right-4"><span className="material-symbols-outlined text-[26px]">chevron_right</span></button>
            </div>

            <div className="mt-6 flex flex-col items-center space-y-4 text-center sm:mt-8">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7890b8] sm:text-xs">{world.number} / {world.system}</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl">{world.name}</h2>
                <p className="mt-1 text-xs text-text-light-blue">{world.description}</p>
                <a href={world.source} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8ea5ca] underline decoration-white/20 underline-offset-4 transition hover:text-neon-lime">
                  Imagen y datos: NASA
                </a>
              </div>
              <button disabled={world.style !== 'mars'} onClick={() => onMarsSelected?.()} className="neon-pill-glow inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full bg-neon-lime px-8 py-3 text-sm font-extrabold tracking-wide text-black transition-all duration-300 hover:scale-[1.03] hover:bg-[#efff33] active:scale-95 sm:px-10 sm:text-base">
                <span>{world.style === 'mars' ? 'Explorar Marte' : 'Próximamente'}</span><span className="material-symbols-outlined text-[20px] font-bold">arrow_forward</span>
              </button>
            </div>
          </section>
        </div>

        <div className="flex w-full items-center justify-end pt-6 sm:pt-4">
          <a href="#desarrolladores" onClick={(event) => { event.preventDefault(); setModalOpen(true); }} className="group inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium tracking-wide text-text-light-blue/80 transition-colors hover:text-white sm:text-sm">
            <span>Desarrolladores</span><span className="material-symbols-outlined text-[15px] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">north_east</span>
          </a>
        </div>
      </main>

      {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="developers-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#08152e] p-6 shadow-2xl sm:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <h3 id="developers-title" className="text-lg font-bold text-white">Equipo de Desarrolladores</h3>
            <button aria-label="Cerrar" onClick={() => setModalOpen(false)} className="text-text-light-blue transition-colors hover:text-white"><span className="material-symbols-outlined">close</span></button>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-text-light-blue">Proyecto desarrollado para el reto global de <strong>NASA Space Apps Challenge</strong>. Exploración interactiva del sistema solar y datos científicos de código abierto.</p>
          <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div><p className="text-sm font-semibold text-white">Diseño &amp; Frontend</p><p className="text-xs text-text-light-blue">Equipo de Misión Planetaria</p></div>
            <span className="rounded-full border border-neon-lime/30 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-neon-lime">CONECTADO</span>
          </div>
          <button onClick={() => setModalOpen(false)} className="w-full rounded-full bg-neon-lime py-2.5 text-sm font-bold text-black transition-colors hover:bg-[#efff33]">Aceptar</button>
        </div>
      </div>}
    </div>
  );
}

function PlanetBadge({ world, onClick }) {
  return <button onClick={onClick} className="group flex cursor-pointer flex-col items-center transition-transform hover:-translate-y-0.5" aria-label={`Ir a ${world.name}`}>
    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-[#0a1835]/70 text-xs font-semibold tracking-wider text-text-light-blue backdrop-blur-md transition-colors group-hover:border-neon-lime group-hover:text-neon-lime sm:h-12 sm:w-12 sm:text-sm">{world.number}</span>
    <span className="mt-2 text-xs font-medium text-text-light-blue transition-colors group-hover:text-white sm:text-sm">{world.name}</span>
  </button>;
}

export default App;
