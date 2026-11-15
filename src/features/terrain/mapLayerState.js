export const MAP_LAYERS = Object.freeze({
  orbital: { label: 'orbital imagery' }, geology: { label: 'geology' },
  slopes: { label: 'slopes' }, heat: { label: 'modelled solar incidence', note: 'This represents modelled solar incidence, not measured temperature.' },
  contours: { label: 'elevation contours' }, elevation: { label: 'elevation colours' },
  route: { label: 'calculated route' }, hazards: { label: 'known blocked areas' }, coverage: { label: 'unobserved ground' },
})
export function initialMapLayers(pointId = 'jezero') {
  return { orbital: true, geology: false, slopes: false, heat: false, contours: pointId !== 'wildcat-ridge', elevation: false, route: true, hazards: true, coverage: false }
}
export function mapLayerReducer(state, action) {
  if (action.type !== 'visibility' || !Object.hasOwn(MAP_LAYERS, action.layer) || typeof action.visible !== 'boolean') return state
  return state[action.layer] === action.visible ? state : { ...state, [action.layer]: action.visible }
}
