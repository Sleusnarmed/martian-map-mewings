import { useEffect, useMemo, useRef, useState } from 'react'
import { horizontalSkyDirection, localSkyFrame } from './marsSkyModel.js'
import './mars-sky.css'

const radians = Math.PI / 180
const names = new Map([
  [32349, 'Sirio'], [30438, 'Canopo'], [69673, 'Arturo'],
  [91262, 'Vega'], [24608, 'Capella'], [24436, 'Rigel'],
  [27989, 'Betelgeuse'], [102098, 'Deneb'], [80763, 'Antares'],
])
// Reference figures expressed as Hipparcos IDs. Each chain is independent.
const figures = [
  [27989, 26727, 27366, 24436, 25930, 25336, 27989],
  [25930, 26311, 26727],
  [54061, 53910, 58001, 59774, 54061],
  [59774, 62956, 65378, 67301],
]

function chartPoint(azimuth, altitude, heading, radius) {
  const distance = radius * (1 - altitude / (Math.PI / 2))
  return [distance * Math.sin(azimuth - heading), -distance * Math.cos(azimuth - heading)]
}

function drawChart(canvas, stars, heading, showFigures) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvas.width
  const center = size / 2
  const radius = size * 0.39
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(center, center)
  ctx.fillStyle = '#081a33'
  ctx.strokeStyle = '#627b9e'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, 2 * Math.PI)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = '#28415f'
  for (const fraction of [1 / 3, 2 / 3]) {
    ctx.beginPath()
    ctx.arc(0, 0, radius * fraction, 0, 2 * Math.PI)
    ctx.stroke()
  }
  const projected = new Map(stars.map(star => [
    star.id, chartPoint(star.azimuth, star.altitude, heading, radius),
  ]))
  if (showFigures) {
    ctx.strokeStyle = '#7ea7dc'
    for (const chain of figures) {
      for (let index = 1; index < chain.length; index++) {
        const start = projected.get(chain[index - 1])
        const end = projected.get(chain[index])
        if (!start || !end) continue
        ctx.beginPath()
        ctx.moveTo(...start)
        ctx.lineTo(...end)
        ctx.stroke()
      }
    }
  }
  for (const star of stars) {
    const [x, y] = projected.get(star.id)
    ctx.fillStyle = `rgba(228,239,255,${Math.max(0.45, 1 - star.magnitude * 0.12)})`
    ctx.beginPath()
    ctx.arc(x, y, Math.max(1.1, 3.3 - 0.53 * star.magnitude), 0, 2 * Math.PI)
    ctx.fill()
  }
  if (showFigures) {
    ctx.font = '15px sans-serif'
    ctx.fillStyle = '#dbeaff'
    for (const [id, name] of names) {
      const point = projected.get(id)
      if (point) ctx.fillText(name, point[0] + 7, point[1] - 5)
    }
  }
  for (const [index, label] of ['N', 'E', 'S', 'O'].entries()) {
    const [x, y] = chartPoint(index * Math.PI / 2, 0, heading, radius + 17)
    ctx.fillStyle = '#f1f6ff'
    ctx.font = 'bold 17px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y)
  }
  ctx.fillStyle = '#eafe07'
  ctx.beginPath()
  ctx.moveTo(0, -radius + 4)
  ctx.lineTo(-6, -radius + 17)
  ctx.lineTo(6, -radius + 17)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export default function MarsSkyChart({ sky, longitude, latitude, heading }) {
  const canvas = useRef(null)
  const [showFigures, setShowFigures] = useState(false)
  const stars = useMemo(() => {
    if (!sky) return []
    const frame = localSkyFrame(longitude, latitude)
    return sky.stars.map(star => ({
      ...star, ...horizontalSkyDirection(star.direction, frame),
    })).filter(star => star.altitude >= 0)
  }, [sky, longitude, latitude])

  useEffect(() => {
    if (canvas.current) drawChart(canvas.current, stars, heading * radians, showFigures)
  }, [stars, heading, showFigures])

  if (!sky) return <p role="status">Cielo sincronizado no disponible para este sol.</p>
  const utc = new Date(sky.utcMs).toISOString()
  return <figure className="mars-sky-chart" aria-label="Mapa celeste del horizonte marciano">
    <div className="mars-sky-chart-meta">
      <strong>Rumbo {Math.round(heading) % 360}°</strong>
      <time dateTime={utc}>{utc.slice(0, 10)} · {utc.slice(11, 19)} UTC</time>
    </div>
    <canvas ref={canvas} width={520} height={520} role="img"
      aria-label="Estrellas sobre el horizonte. El rumbo de la cámara está hacia arriba." />
    <figcaption>{latitude.toFixed(4)}° N · {longitude.toFixed(4)}° E · horizonte geométrico</figcaption>
    <label className="mars-sky-figures">
      <input type="checkbox" checked={showFigures} onChange={event => setShowFigures(event.target.checked)} />
      Trazos y nombres de referencia
    </label>
    <p>Las estrellas se muestran como referencia incluso de día. <a href="https://cdsarc.cds.unistra.fr/viz-bin/cat/I/239" target="_blank" rel="noreferrer">Hipparcos / CDS</a></p>
  </figure>
}
