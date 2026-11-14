export const DEM_SOURCE = 'https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic'
export const DEM_DOWNLOAD = 'https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif'

export async function loadTerrain(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
    throw new Error('Jezero elevation data has not been prepared yet.')
  }
  const metadata = await response.json()
  const { width, height, bounds, radius, minimumHeight, maximumHeight } = metadata
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 ||
      width * height > 4194304 || !Array.isArray(bounds) || bounds.length !== 4 ||
      !bounds.every(Number.isFinite) || bounds[0] >= bounds[2] || bounds[1] >= bounds[3] ||
      bounds[0] < -180 || bounds[2] > 180 || bounds[1] < -90 || bounds[3] > 90 ||
      !Number.isFinite(radius) || radius < 3300000 || radius > 3500000 ||
      !Number.isFinite(minimumHeight) || !Number.isFinite(maximumHeight) || minimumHeight >= maximumHeight) {
    throw new Error('The terrain metadata is invalid. Rebuild the terrain package.')
  }
  const binary = await fetch(new URL(metadata.heightFile, new URL(url, window.location.href)), { signal })
  if (!binary.ok) throw new Error('The elevation grid is missing.')
  const buffer = await binary.arrayBuffer()
  if (buffer.byteLength !== width * height * 4) throw new Error('The elevation grid has the wrong size.')
  const view = new DataView(buffer)
  const heights = Float32Array.from({ length: width * height }, (_, i) => view.getFloat32(i * 4, true))
  if (!heights.every(Number.isFinite)) throw new Error('The terrain contains missing elevation cells.')
  return { ...metadata, heights }
}

// Grid samples run west to east, north to south. Heights remain in source metres.
export function sampleHeight(data, longitude, latitude) {
  const [west, south, east, north] = data.bounds
  if (longitude < west || longitude > east || latitude < south || latitude > north) return null
  const x = (longitude - west) / (east - west) * (data.width - 1)
  const y = (north - latitude) / (north - south) * (data.height - 1)
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const x1 = Math.min(x0 + 1, data.width - 1), y1 = Math.min(y0 + 1, data.height - 1)
  const fx = x - x0, fy = y - y0
  const at = (col, row) => data.heights[row * data.width + col]
  return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy) +
    (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy
}
