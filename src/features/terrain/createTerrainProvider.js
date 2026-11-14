import { Credit, Ellipsoid, Event, GeographicTilingScheme, HeightmapTerrainData, Rectangle, TileAvailability } from 'cesium'

export const TILE_SIZE = 65

// Sample in raster space so adjacent tiles use exactly the same edge coordinates.
export function buildHeightTile(data, x, y, level) {
  const buffer = new Float32Array(TILE_SIZE * TILE_SIZE)
  const scale = 2 ** level
  for (let row = 0; row < TILE_SIZE; row++) {
    const gy = (y + row / (TILE_SIZE - 1)) / scale * (data.height - 1)
    const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, data.height - 1)
    const fy = gy - y0
    for (let col = 0; col < TILE_SIZE; col++) {
      const gx = (x + col / (TILE_SIZE - 1)) / scale * (data.width - 1)
      const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, data.width - 1)
      const fx = gx - x0
      const north = data.heights[y0 * data.width + x0] * (1 - fx) + data.heights[y0 * data.width + x1] * fx
      const south = data.heights[y1 * data.width + x0] * (1 - fx) + data.heights[y1 * data.width + x1] * fx
      buffer[row * TILE_SIZE + col] = north * (1 - fy) + south * fy
    }
  }
  return buffer
}

export function createTerrainProvider(data) {
  const ellipsoid = new Ellipsoid(data.radius, data.radius, data.radius)
  const rectangle = Rectangle.fromDegrees(...data.bounds)
  const tilingScheme = new GeographicTilingScheme({ ellipsoid, rectangle, numberOfLevelZeroTilesX: 1, numberOfLevelZeroTilesY: 1 })
  const maximumLevel = Math.max(0, Math.ceil(Math.log2((Math.max(data.width, data.height) - 1) / (TILE_SIZE - 1))))
  const availability = new TileAvailability(tilingScheme, maximumLevel)
  for (let level = 0; level <= maximumLevel; level++) {
    availability.addAvailableTileRange(level, 0, 0, 2 ** level - 1, 2 ** level - 1)
  }
  const baseError = data.radius * Math.max(rectangle.width, rectangle.height) / (TILE_SIZE - 1)
  // Source buffers are retained independently: Cesium releases terrain buffers after meshing.
  // Max 341 entries (~5.5 MiB) for the shipped 1025-square DEM; LRU bounds other inputs.
  const cache = new Map()
  const cacheLimit = 341
  const provider = {
    tilingScheme, availability, maximumLevel,
    errorEvent: new Event(),
    credit: new Credit('NASA / JPL / USGS · MRO CTX elevation · MOLA reference'),
    hasWaterMask: false,
    hasVertexNormals: false,
    getLevelMaximumGeometricError(level) {
      // Never refine beyond the actual raster detail, even at extreme zoom.
      return level >= maximumLevel ? 0 : baseError / (2 ** level)
    },
    getTileDataAvailable(x, y, level) {
      return Number.isInteger(level) && level >= 0 && level <= maximumLevel &&
        Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < 2 ** level && y < 2 ** level
    },
    loadTileDataAvailability() { return undefined },
    requestTileGeometry(x, y, level) {
      if (!provider.getTileDataAvailable(x, y, level)) return Promise.reject(new Error('Tile is outside Jezero terrain coverage.'))
      const key = `${level}/${x}/${y}`
      let buffer = cache.get(key)
      if (buffer) cache.delete(key)
      else buffer = buildHeightTile(data, x, y, level)
      cache.set(key, buffer)
      if (cache.size > cacheLimit) cache.delete(cache.keys().next().value)
      return Promise.resolve(new HeightmapTerrainData({
        buffer: buffer.slice(), width: TILE_SIZE, height: TILE_SIZE,
        childTileMask: level < maximumLevel ? 15 : 0,
      }))
    },
  }
  return provider
}
