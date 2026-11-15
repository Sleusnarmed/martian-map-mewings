import { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import './home.css';
import HomeMarsGlobe from './HomeMarsGlobe';
import spaceApps from '../../NASA Space Apps Logos - 2026/Space Apps Logo Color and White.svg';
import orbits from '../../Patterns/Orbits.png';
import SolarSky from './SolarSky';
import useSolarRotation from './useSolarRotation';
import { WORLDS } from './solarWorlds';

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

function PlanetNeighbor({ world, onSelect }) {
  return (
    <button type="button" className="solar-neighbor" onClick={onSelect}>
      <Planet world={world} />
      <span>{world.name}</span>
    </button>
  );
}

function DevelopersDialog({ dialog }) {
  return (
    <dialog ref={dialog} className="solar-dialog" aria-labelledby="developers-title">
      <div className="solar-dialog-header">
        <h2 id="developers-title">Development team</h2>
        <form method="dialog"><button aria-label="Close"><Icon>close</Icon></button></form>
      </div>
      <p>Designed and developed for the <strong>NASA Space Apps Challenge</strong> by:</p>
      <ul className="solar-developers">
        {['sleusnarmed', 'mjsb05', 'maverick2505', 'eddyRuLop', 'VladymirVazquez', 'Eduardo450'].map(handle => (
          <li key={handle}><span>@{handle}</span></li>
        ))}
      </ul>
    </dialog>
  );
}

export default function Home({ onZoneSelected, expanded = false, onExpandedChange }) {
  const root = useRef(null);
  const preview = useRef(null);
  const marsAnchor = useRef(null);
  const dialog = useRef(null);
  const previousArrow = useRef(null);
  const nextArrow = useRef(null);
  const [worldIndex, setWorldIndex] = useState(marsIndex);
  const [showFigures, setShowFigures] = useState(false);
  const world = WORLDS[worldIndex];
  const previousWorld = WORLDS[adjacentIndex(worldIndex, -1)];
  const nextWorld = WORLDS[adjacentIndex(worldIndex, 1)];
  const isMars = world.id === 'mars';

  useSolarRotation(root, !expanded);

  useEffect(() => {
    if (expanded) return;
    function handleKey(event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || dialog.current?.open || event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      const offset = event.key === 'ArrowLeft' ? -1 : 1;
      if (document.activeElement?.matches('.solar-mars-hit, .solar-mission')) {
        const arrow = offset < 0 ? previousArrow : nextArrow;
        arrow.current?.focus({ preventScroll: true });
      }
      setWorldIndex(index => adjacentIndex(index, offset));
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [expanded]);

  useEffect(() => {
    if (expanded || isMars || !preview.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const transition = animate(preview.current, {
      opacity: [.45, 1], scale: [.91, 1], duration: 580, ease: 'outCubic',
    });
    return () => transition.revert();
  }, [expanded, worldIndex, isMars]);

  const openMars = () => onExpandedChange?.(true);
  const moveWorld = offset => setWorldIndex(index => adjacentIndex(index, offset));

  return (
    <div className={`solar-home${expanded ? ' solar-home--expanded' : ''}`} ref={root} lang="en" style={{ '--world-accent': world.color }}>
      <div className="solar-background" aria-hidden="true">
        <img className="solar-orbits" src={orbits} alt="" />
        <SolarSky showFigures={showFigures} />
      </div>
      <div className="solar-shell" inert={expanded}>
        <main className="solar-layout">
          <div className="solar-copy">
            <p className="solar-kicker">NASA Space Apps Challenge</p>
            <h1>Martian <span>Map</span></h1>
            <p className="solar-intro">Explore Mars. Discover Jezero.</p>
          </div>

          <section className="solar-showcase" aria-label="Planet carousel">
            <nav className="solar-neighbors" aria-label="Adjacent planets">
              <PlanetNeighbor world={previousWorld} onSelect={() => moveWorld(-1)} />
              <PlanetNeighbor world={nextWorld} onSelect={() => moveWorld(1)} />
            </nav>
            <div className="solar-stage">
              <button type="button" className="solar-arrow solar-arrow--left" ref={previousArrow}
                aria-label="Previous planet" aria-keyshortcuts="ArrowLeft" onClick={() => moveWorld(-1)}>
                <Icon>chevron_left</Icon>
              </button>
              <div className="solar-preview" ref={preview}>
                <div className="solar-mars-anchor" ref={marsAnchor} />
                <button type="button" className="solar-mars-hit" hidden={!isMars} aria-label="Open the Mars globe" onClick={openMars} />
                <div hidden={isMars}><Planet world={world} /></div>
              </div>
              <button type="button" className="solar-arrow solar-arrow--right" ref={nextArrow}
                aria-label="Next planet" aria-keyshortcuts="ArrowRight" onClick={() => moveWorld(1)}>
                <Icon>chevron_right</Icon>
              </button>
            </div>
            <div className="solar-world" aria-live="polite" aria-atomic="true">
              <p className="solar-kind">{world.kind}</p>
              <h2>{world.name}</h2>
            </div>
            <div className="solar-mission-slot">
              {isMars ? (
                <button type="button" className="solar-mission" onClick={openMars}>
                  Explore Mars <Icon>arrow_forward</Icon>
                </button>
              ) : (
                <p className="solar-coming" role="status">Coming soon</p>
              )}
            </div>
          </section>

          <div className="solar-brand">
            <img src={spaceApps} alt="NASA Space Apps Challenge" />
          </div>
        </main>

        <footer className="solar-footer">
          <div className="solar-tools">
            <button type="button" className="solar-utility" aria-pressed={showFigures} onClick={() => setShowFigures(visible => !visible)}>
              <Icon>auto_awesome</Icon> Constellations
            </button>
            <button type="button" className="solar-utility" onClick={() => dialog.current.showModal()}>
              <Icon>code</Icon> Developers
            </button>
          </div>
        </footer>
      </div>
      <HomeMarsGlobe anchor={marsAnchor} expanded={expanded} active={expanded || isMars}
        onZoneSelected={onZoneSelected} onClose={() => onExpandedChange?.(false)} />
      <DevelopersDialog dialog={dialog} />
    </div>
  );
}
