import { Credit, CreditDisplay } from 'cesium'

export function configureOfflineCesiumCredit(viewer) {
  const credit = new Credit('CesiumJS · Cesium GS, Inc.')
  CreditDisplay.cesiumCredit = credit
  viewer?.creditDisplay.addStaticCredit(credit)
}
