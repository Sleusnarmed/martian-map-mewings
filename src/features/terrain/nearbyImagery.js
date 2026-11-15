// A bounded 3×3 window at the original image resolution, biased 90 m ahead.
// Tile indices are west→east, north→south, identical to the offline pyramid.
export function nearbyImageTiles(bounds, point, heading, radius = 3396190) {
  const [west, south, east, north] = bounds
  if (point.longitude < west || point.longitude > east || point.latitude < south || point.latitude > north) return []
  const span = 8, dx = (east - west) / span, dy = (north - south) / span
  const degrees = 90 / (radius * Math.PI / 180)
  const x = Math.max(0, Math.min(7, Math.floor((point.longitude + degrees * Math.sin(heading) / Math.cos(point.latitude * Math.PI / 180) - west) / dx)))
  const y = Math.max(0, Math.min(7, Math.floor((north - point.latitude - degrees * Math.cos(heading)) / dy)))
  const tiles = []
  for (let yy = Math.max(0, y - 1); yy <= Math.min(7, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(7, x + 1); xx++) {
    tiles.push({ key: `${xx}/${yy}`, file: `hirise-tiles/3/${xx}/${yy}.png`,
      bounds: [west + xx * dx, north - (yy + 1) * dy, west + (xx + 1) * dx, north - yy * dy] })
  }
  return tiles
}
