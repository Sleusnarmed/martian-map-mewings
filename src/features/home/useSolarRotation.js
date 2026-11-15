import { useEffect } from 'react';
import { createPlanetRenderer } from './planetRenderer';
import { WORLDS } from './solarWorlds';

const worldsById = new Map(WORLDS.map(world => [world.id, world]));

export default function useSolarRotation(root, enabled) {
  useEffect(() => {
    if (!enabled || !root.current) return;
    const host = root.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let lastDraw = -Infinity;
    let previousTime = null;
    let elapsed = 0;
    let needsDraw = true;
    let contextLost = false;
    const queueFrame = () => {
      if (!frame && !document.hidden && !contextLost) frame = requestAnimationFrame(tick);
    };

    const renderer = createPlanetRenderer(invalidate);
    if (!renderer) return;

    const views = [...host.querySelectorAll('[data-solar-world]')].map(canvas => ({
      canvas, context: canvas.getContext('2d'), size: 0,
    })).filter(view => view.context);

    function invalidate() {
      needsDraw = true;
      queueFrame();
    }

    function tick(time) {
      frame = 0;
      if (document.hidden) return;
      if (!reduceMotion.matches) {
        if (previousTime !== null) elapsed += Math.min(60, time - previousTime) / 1000;
        previousTime = time;
      }
      if (needsDraw || time - lastDraw >= 1000 / 30) {
        needsDraw = false;
        lastDraw = time;
        for (const { canvas, context, size } of views) {
          if (!size) continue;
          const world = worldsById.get(canvas.dataset.solarWorld);
          const angle = reduceMotion.matches ? world.longitude : world.longitude + elapsed * world.rotation;
          if (renderer.draw(world, size, angle % (2 * Math.PI))) {
            context.clearRect(0, 0, size, size);
            context.drawImage(renderer.canvas, 0, renderer.canvas.height - size, size, size, 0, 0, size, size);
            canvas.classList.add('has-planet-texture');
          } else {
            canvas.classList.remove('has-planet-texture');
          }
        }
      }
      if (!reduceMotion.matches) queueFrame();
    }

    const resize = new ResizeObserver(entries => {
      for (const { target, contentRect } of entries) {
        const view = views.find(item => item.canvas === target);
        const size = Math.min(840, Math.round(contentRect.width * Math.min(1.6, window.devicePixelRatio)));
        if (size === view.size) continue;
        view.size = size;
        target.width = size;
        target.height = size;
      }
      const maximum = Math.max(1, ...views.map(view => view.size));
      renderer.canvas.width = maximum;
      renderer.canvas.height = maximum;
      invalidate();
    });
    for (const { canvas } of views) resize.observe(canvas);

    // The selected planet changes on the same canvas, including when motion is off.
    const selection = new MutationObserver(invalidate);
    selection.observe(host, { subtree: true, attributes: true, attributeFilter: ['data-solar-world'] });

    const handleVisibility = () => {
      previousTime = null;
      invalidate();
    };
    const showFallbacks = () => {
      contextLost = true;
      for (const { canvas } of views) canvas.classList.remove('has-planet-texture');
      cancelAnimationFrame(frame);
      frame = 0;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    reduceMotion.addEventListener('change', handleVisibility);
    renderer.canvas.addEventListener('webglcontextlost', showFallbacks);
    for (const world of WORLDS) renderer.preload(world);
    queueFrame();

    return () => {
      resize.disconnect();
      selection.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      reduceMotion.removeEventListener('change', handleVisibility);
      renderer.canvas.removeEventListener('webglcontextlost', showFallbacks);
      showFallbacks();
      renderer.destroy();
    };
  }, [root, enabled]);
}
