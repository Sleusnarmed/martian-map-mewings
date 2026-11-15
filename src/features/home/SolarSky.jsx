import { useEffect, useRef } from 'react';
import { BRIGHT_STARS } from '../mars-sky/brightStars';

const figures = [
  { name: 'Cassiopeia', chains: [[746, 3179, 4427, 6686, 8886]] },
  { name: 'Orion', chains: [[27989, 26727, 27366, 24436, 25930, 25336, 27989], [25930, 26311, 26727]] },
  { name: 'Ursa Major', chains: [[54061, 53910, 58001, 59774, 54061], [59774, 62956, 65378, 67301]] },
  { name: 'Southern Cross', chains: [[60718, 61084], [59747, 62434]] },
];

const stars = BRIGHT_STARS.map(([id, rightAscension, declination, magnitude]) => ({
  id,
  x: ((rightAscension + 65) % 360) / 360,
  y: .57 - declination / 214,
  magnitude,
}));
const byId = new Map(stars.map(star => [star.id, star]));

function drawFigures(ctx, width, height) {
  ctx.strokeStyle = '#74abe2a6';
  ctx.fillStyle = '#aecaf0cc';
  ctx.lineWidth = 1;
  ctx.font = '600 11px Overpass, sans-serif';
  for (const { name, chains } of figures) {
    for (const chain of chains) {
      ctx.beginPath();
      chain.forEach((id, index) => {
        const { x, y } = byId.get(id);
        if (index === 0) ctx.moveTo(x * width, y * height);
        else ctx.lineTo(x * width, y * height);
      });
      ctx.stroke();
    }
    const { x, y } = byId.get(chains[0][0]);
    if (width >= 600) ctx.fillText(name, x * width + 7, y * height - 6);
  }
}

export default function SolarSky({ showFigures }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = new ResizeObserver(([{ contentRect: { width, height } }]) => {
      const scale = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx.scale(scale, scale);
      if (showFigures) drawFigures(ctx, width, height);
      for (const { x, y, magnitude } of stars) {
        const opacity = Math.max(.1, Math.min(.89, .77 - magnitude * .145));
        ctx.fillStyle = `rgba(219,233,255,${opacity})`;
        ctx.beginPath();
        ctx.arc(x * width, y * height, Math.max(.55, 1.65 - magnitude * .24), 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    resize.observe(canvas);
    return () => resize.disconnect();
  }, [showFigures]);

  return <canvas className="solar-sky" ref={canvasRef} aria-hidden="true" />;
}
