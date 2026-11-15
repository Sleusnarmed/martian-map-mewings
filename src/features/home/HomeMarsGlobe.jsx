import { lazy, Suspense, useLayoutEffect, useState } from 'react';
import SpaceLoader from '../../components/SpaceLoader';

const MarsGlobe = lazy(() => import('../../components/MarsGlobe3D'));

// The viewer never changes React position or key when the preview expands.
// Only its viewport grows, retaining the camera, imagery and GPU resources.
export default function HomeMarsGlobe({ anchor, expanded, active, onZoneSelected, onClose }) {
  const [frame, setFrame] = useState(null);
  useLayoutEffect(() => {
    let pending;
    const measure = () => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(() => {
        const box = anchor.current?.getBoundingClientRect();
        if (!box) return;
        const next = expanded
          ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
          : { left: box.left, top: box.top, width: box.width, height: box.height };
        setFrame(previous => previous && Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
      });
    };
    const observer = new ResizeObserver(measure);
    if (anchor.current) observer.observe(anchor.current);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      cancelAnimationFrame(pending);
    };
  }, [anchor, expanded]);

  return <div className={`home-mars-globe${expanded ? ' home-mars-globe--expanded' : ''}`}
    style={{ ...frame, visibility: active && frame ? 'visible' : 'hidden' }} inert={!active}>
    <Suspense fallback={<SpaceLoader />}>
      <MarsGlobe compact={!expanded} active={active} onZoneSelected={onZoneSelected} />
    </Suspense>
    {expanded && <button className="globe-home-back" onClick={onClose}>← Solar system</button>}
  </div>;
}
