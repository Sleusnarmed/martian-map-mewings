import { Credit, Event, GeographicTilingScheme, Rectangle } from 'cesium'

// Public ImageryProvider interface backed by one explicitly owned ImageBitmap.
// The owner closes the bitmap after removing the layer and its GPU textures.
export function createPatchProvider(image, bounds, ellipsoid, credit) {
  const rectangle = Rectangle.fromDegrees(...bounds)
  return { tileWidth: image.width, tileHeight: image.height, minimumLevel: 0, maximumLevel: 0,
    rectangle, hasAlphaChannel: true, errorEvent: new Event(), credit: new Credit(credit),
    tilingScheme: new GeographicTilingScheme({ rectangle, ellipsoid, numberOfLevelZeroTilesX: 1, numberOfLevelZeroTilesY: 1 }),
    requestImage: () => Promise.resolve(image), getTileCredits: () => undefined, pickFeatures: () => undefined }
}
