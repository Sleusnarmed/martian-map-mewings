export const MAP_LAYERS = Object.freeze({
  orbital: { label: 'imagen orbital' }, geology: { label: 'geología' },
  slopes: { label: 'pendientes' }, heat: { label: 'incidencia solar modelada', note: 'Representa incidencia solar modelada, no temperatura medida.' },
  contours: { label: 'curvas de nivel' }, elevation: { label: 'colores de elevación' },
  route: { label: 'ruta calculada' }, hazards: { label: 'zonas bloqueadas conocidas' }, coverage: { label: 'terreno sin observar' },
})
export function initialMapLayers(pointId = 'jezero') {
  return { orbital: true, geology: false, slopes: false, heat: false, contours: pointId !== 'wildcat-ridge', elevation: false, route: true, hazards: true, coverage: false }
}
export function mapLayerReducer(state, action) {
  if (action.type !== 'visibility' || !Object.hasOwn(MAP_LAYERS, action.layer) || typeof action.visible !== 'boolean') return state
  return state[action.layer] === action.visible ? state : { ...state, [action.layer]: action.visible }
}
