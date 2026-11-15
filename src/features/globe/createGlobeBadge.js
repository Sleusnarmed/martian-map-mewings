// Generador de etiquetas en Canvas HD para nitidez total en pantallas Retina / Tablet
export function createCrispBadge(
  text,
  accentColor = "#2E96F5",
  textColor = "#FFFFFF",
  isDisabled = false,
) {
  const scale = 3;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const fontSize = (isDisabled ? 11.5 : 13) * scale;
  ctx.font = `700 ${fontSize}px "Fira Sans", sans-serif`;
  const textMetrics = ctx.measureText(text);

  const padX = (isDisabled ? 10 : 12) * scale;
  const padY = (isDisabled ? 5 : 6) * scale;
  const dotRadius = (isDisabled ? 3.5 : 4) * scale;
  const dotGap = 6 * scale;

  const width = Math.ceil(
    textMetrics.width + padX * 2 + dotRadius * 2 + dotGap,
  );
  const height = Math.ceil(fontSize + padY * 2);

  canvas.width = width;
  canvas.height = height;

  const radius = 6 * scale;
  ctx.fillStyle = isDisabled
    ? "rgba(15, 23, 42, 0.85)"
    : "rgba(7, 23, 63, 0.95)";
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, radius);
  ctx.fill();

  ctx.strokeStyle = isDisabled ? "rgba(148, 163, 184, 0.45)" : accentColor;
  ctx.lineWidth = (isDisabled ? 1 : 1.6) * scale;
  ctx.stroke();

  ctx.fillStyle = isDisabled ? "#94A3B8" : accentColor;
  ctx.beginPath();
  ctx.arc(padX + dotRadius, height / 2, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `700 ${fontSize}px "Fira Sans", sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX + dotRadius * 2 + dotGap, height / 2 + 1);

  return {
    image: canvas,
    width: width / scale,
    height: height / scale,
  };
}

