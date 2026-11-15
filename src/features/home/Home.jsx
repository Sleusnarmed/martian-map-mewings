import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import './home.css';
import SpaceLoader from '../../components/SpaceLoader';
import spaceApps from '../../NASA Space Apps Logos - 2026/Space Apps Logo Color and White.svg';
import useSolarRotation from './useSolarRotation';
import { WORLDS } from './solarWorlds';

const MarsGlobe = lazy(() => import('../../components/MarsGlobe3D'));
const marsIndex = WORLDS.findIndex(world => world.id === 'mars');

function adjacentIndex(index, offset) {
  return (index + offset + WORLDS.length) % WORLDS.length;
}

function Icon({ children }) {
  return <span className="material-symbols-outlined" aria-hidden="true">{children}</span>;
}

function Planet({ world }) {
  return (
    <span className={`solar-planet solar-planet--${world.id}`} aria-hidden="true">
      <canvas data-solar-world={world.id} />
      <img src={`${import.meta.env.BASE_URL}assets/planets/${world.id}.jpg`} alt="" draggable="false" />
    </span>
  );
}

function DevelopersDialog({ dialog }) {
  return (
    <dialog ref={dialog} className="solar-dialog" aria-labelledby="developers-title">
      <div className="solar-dialog-header">
        <h2 id="developers-title">Equipo de Desarrolladores</h2>
        <form method="dialog"><button aria-label="Cerrar"><Icon>close</Icon></button></form>
      </div>
      <p>Proyecto desarrollado para el reto global de <strong>NASA Space Apps Challenge</strong>.</p>
      <p>Diseño y desarrollo · Equipo de Misión Planetaria</p>
    </dialog>
  );
}

export default function Home({ onZoneSelected, expanded = false, onExpandedChange }) {
  const root = useRef(null);
  const preview = useRef(null);
  const dialog = useRef(null);
  const picker = useRef(null);
  const [worldIndex, setWorldIndex] = useState(marsIndex);
  const world = WORLDS[worldIndex];
  const isMars = world.id === 'mars';

  useSolarRotation(root, !expanded);

  useEffect(() => {
    if (expanded) return;
    function handleKey(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || dialog.current?.open || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      const next = adjacentIndex(worldIndex, event.key === 'ArrowLeft' ? -1 : 1);
      setWorldIndex(next);
      if (picker.current?.contains(document.activeElement)) {
        picker.current.querySelectorAll('button')[next]?.focus({ preventScroll: true });
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded, worldIndex]);

  useEffect(() => {
    if (!preview.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const transition = animate(preview.current, {
      opacity: [.45, 1], scale: [.91, 1], duration: 580, ease: 'outCubic',
    });
    return () => transition.revert();
  }, [expanded, worldIndex]);

  const openMars = () => onExpandedChange?.(true);
  const moveWorld = offset => setWorldIndex(index => adjacentIndex(index, offset));

  if (expanded) return (
    <main className="home-globe home-globe-expanded">
      <div className="globe-starfield" aria-hidden="true" />
      <Suspense fallback={<SpaceLoader />}><MarsGlobe onZoneSelected={onZoneSelected} /></Suspense>
      <button className="globe-home-back" onClick={() => onExpandedChange?.(false)}>← Sistema solar</button>
    </main>
  );

  return (
    <div className="solar-home" ref={root} lang="es" style={{ '--world-accent': world.color }}>
      <div className="globe-starfield solar-background" aria-hidden="true" />
      <div className="solar-shell">
        <header className="solar-header">
          <a href="https://www.spaceappschallenge.org/" target="_blank" rel="noreferrer">
            <img src={spaceApps} alt="NASA Space Apps Challenge" />
          </a>
          <button className="solar-utility" onClick={() => dialog.current.showModal()}>
            Desarrolladores <Icon>north_east</Icon>
          </button>
        </header>

        <nav className="solar-picker" ref={picker} aria-label="Planetas del sistema solar">
          {WORLDS.map((item, index) => (
            <button key={item.id} className="solar-pick" aria-current={index === worldIndex ? 'true' : undefined}
              onClick={() => setWorldIndex(index)}>
              <Planet world={item} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <main className="solar-layout">
          <div className="solar-copy">
            <h1>Martian <span>Map</span></h1>
            <p className="solar-intro">Explora el sistema solar y planifica una expedición en Marte.</p>
          </div>

          <div className="solar-stage" aria-label="Vista del planeta seleccionado">
            <button className="solar-arrow solar-arrow--left" aria-label="Planeta anterior" aria-keyshortcuts="ArrowLeft" onClick={() => moveWorld(-1)}>
              <Icon>chevron_left</Icon>
            </button>
            <div className="solar-preview" ref={preview}>
              <button className="solar-mars-hit" hidden={!isMars} aria-label="Explorar Marte" onClick={openMars} />
              <Planet world={world} />
            </div>
            <button className="solar-arrow solar-arrow--right" aria-label="Planeta siguiente" aria-keyshortcuts="ArrowRight" onClick={() => moveWorld(1)}>
              <Icon>chevron_right</Icon>
            </button>
          </div>

          <section className="solar-world" aria-live="polite" aria-atomic="true">
            <p className="solar-kind">{world.kind}</p>
            <h2>{world.name}</h2>
            <p className="solar-description">{world.description}</p>
            {isMars ? (
              <button className="solar-mission" onClick={openMars}>
                <span><strong>Explorar Marte</strong><small>{world.detail}</small></span>
                <Icon>arrow_forward</Icon>
              </button>
            ) : (
              <p className="solar-detail">{world.detail}</p>
            )}
          </section>
        </main>

        <footer className="solar-footer">
          <a href={world.source} target="_blank" rel="noreferrer">Datos planetarios · NASA <Icon>north_east</Icon></a>
          <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noreferrer">Texturas · Solar System Scope <Icon>north_east</Icon></a>
        </footer>
      </div>
      <DevelopersDialog dialog={dialog} />
    </div>
  );
}
