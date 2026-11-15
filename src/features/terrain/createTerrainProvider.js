import { Credit, Ellipsoid, Event, GeographicTilingScheme, HeightmapTerrainData, Rectangle, TileAvailability } from 'cesium'
import { sampleHeight } from './terrainData.js'

export const TILE_SIZE = 65

// Sample in raster space so adjacent tiles use exactly the same edge coordinates.
export function buildHeightTile(data, x, y, level) {
  const buffer = new Float32Array(TILE_SIZE * TILE_SIZE)
  const scale = 2 ** level
  const [west, south, east, north] = data.bounds
  const detail = data.detail
  for (let row = 0; row < TILE_SIZE; row++) {
    const v = (y + row / (TILE_SIZE - 1)) / scale
    const gy = v * (data.height - 1)
    const y0 = Math.floor(gy), y1 = Math.min(y0 + 1, data.height - 1)
    const fy = gy - y0
    for (let col = 0; col < TILE_SIZE; col++) {
      const u = (x + col / (TILE_SIZE - 1)) / scale
      const gx = u * (data.width - 1)
      if (detail) {
        const lon = west + u * (east - west)
        const lat = north + v * (south - north)
        if (lon > detail.bounds[0] && lon < detail.bounds[2] && lat > detail.bounds[1] && lat < detail.bounds[3]) {
          buffer[row * TILE_SIZE + col] = sampleHeight(data, lon, lat)
          continue
        }
      }
      const x0 = Math.floor(gx), x1 = Math.min(x0 + 1, data.width - 1)
      const fx = gx - x0
      const northHeight = data.heights[y0 * data.width + x0] * (1 - fx) + data.heights[y0 * data.width + x1] * fx
      const southHeight = data.heights[y1 * data.width + x0] * (1 - fx) + data.heights[y1 * data.width + x1] * fx
      buffer[row * TILE_SIZE + col] = northHeight * (1 - fy) + southHeight * fy
    }
  }
  return buffer
}

export function createTerrainProvider(data) {
  const ellipsoid = new Ellipsoid(data.radius, data.radius, data.radius)
  const rectangle = Rectangle.fromDegrees(...data.bounds)
  const tilingScheme = new GeographicTilingScheme({ ellipsoid, rectangle, numberOfLevelZeroTilesX: 1, numberOfLevelZeroTilesY: 1 })
  const regionalLevel = Math.max(0, Math.ceil(Math.log2((Math.max(data.width, data.height) - 1) / (TILE_SIZE - 1))))
  const baseError = data.radius * Math.max(rectangle.width, rectangle.height) / (TILE_SIZE - 1)
  const maximumLevel = data.detail
    ? Math.max(regionalLevel, Math.floor(Math.log2(baseError / data.detail.displayResolutionMeters)))
    : regionalLevel
  const availability = new TileAvailability(tilingScheme, maximumLevel)
  const detailRectangle = data.detail ? Rectangle.fromDegrees(...data.detail.bounds) : null
  for (let level = 0; level <= maximumLevel; level++) {
    if (level <= regionalLevel) {
      availability.addAvailableTileRange(level, 0, 0, 2 ** level - 1, 2 ** level - 1)
      continue
    }
    const northwest = tilingScheme.positionToTileXY(Rectangle.northwest(detailRectangle), level)
    const southeast = tilingScheme.positionToTileXY(Rectangle.southeast(detailRectangle), level)
    availability.addAvailableTileRange(level, northwest.x, northwest.y, southeast.x, southeast.y)
  }
  // Source buffers are retained independently: Cesium releases terrain buffers after meshing.
  // Max 341 entries (~5.5 MiB) for the shipped 1025-square DEM; LRU bounds other inputs.
  const cache = new Map()
  const cacheLimit = 341
  const provider = {
    tilingScheme, availability, maximumLevel,
    errorEvent: new Event(),
    credit: new Credit(data.detail ? 'NASA / JPL / USGS · CTX + local HiRISE elevation' : 'NASA / JPL / USGS · MRO CTX elevation · MOLA reference'),
    hasWaterMask: false,
    hasVertexNormals: false,
    getLevelMaximumGeometricError(level) {
      // Never refine beyond the actual raster detail, even at extreme zoom.
      return level >= maximumLevel ? 0 : baseError / (2 ** level)
    },
    getTileDataAvailable(x, y, level) {
      return Number.isInteger(level) && level >= 0 && level <= maximumLevel &&
        Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < 2 ** level && y < 2 ** level &&
        availability.isTileAvailable(level, x, y)
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
      // Cesium's availability helper treats its maximum level as exclusive for child masks.
      // Match the same inclusive availability used by requestTileGeometry.
      const childLevel = level + 1
      let childTileMask = 0
      if (childLevel <= maximumLevel) {
        if (provider.getTileDataAvailable(x * 2, y * 2 + 1, childLevel)) childTileMask |= 1
        if (provider.getTileDataAvailable(x * 2 + 1, y * 2 + 1, childLevel)) childTileMask |= 2
        if (provider.getTileDataAvailable(x * 2, y * 2, childLevel)) childTileMask |= 4
        if (provider.getTileDataAvailable(x * 2 + 1, y * 2, childLevel)) childTileMask |= 8
      }
      return Promise.resolve(new HeightmapTerrainData({
        buffer: buffer.slice(), width: TILE_SIZE, height: TILE_SIZE,
        childTileMask,
      }))
    },
  }
  return provider
}
