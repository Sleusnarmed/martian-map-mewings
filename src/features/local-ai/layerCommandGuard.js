const aliases = {
  orbital: /\b(orbital|satelite|textura|satelital|satellite|imagery|texture)\b/, geology: /\b(geologia|geologica|geologico|geology|geological)\b/,
  slopes: /\b(pendiente|pendientes|inclinacion|slopes?|inclination)\b/, heat: /\b(calor|solar|termica|termico|heat|heating|thermal)\b/,
  contours: /\b(curvas? de nivel|contornos|contours?)\b/, elevation: /\b(elevacion|altitud|relieve|elevation|altitude|relief)\b/,
  route: /\b(ruta|recorrido|camino|route|path)\b/, hazards: /\b(bloquead[ao]s?|peligros|obstaculos|bloqueos|blocked|hazards?|obstacles?)\b/,
  coverage: /\b(sin observar|no observado|desconocido|exploracion|cobertura|unobserved|unexplored|unknown|coverage|exploration)\b/,
}

// Only complete, explicit one-layer commands qualify. Never fuzzy-match speech
// or turn a question, negation or compound instruction into a map mutation.
const layerNames = {
  slopes: ['slope', 'slopes', 'slope map', 'pendientes', 'pendiente', 'inclinacion'],
  heat: ['heat', 'heat map', 'solar heat map', 'thermal map', 'calor', 'mapa de calor'],
  geology: ['geology', 'geologic units', 'geologia', 'unidades geologicas'],
  contours: ['contours', 'contour lines', 'elevation contours', 'curvas de nivel', 'contornos'],
  elevation: ['elevation', 'elevation colors', 'relief', 'elevacion', 'altitud', 'relieve'],
  orbital: ['orbital imagery', 'satellite imagery', 'orbital image', 'imagen orbital', 'imagen satelital'],
  route: ['route', 'calculated route', 'ruta', 'recorrido', 'camino'],
  hazards: ['hazards', 'obstacles', 'blocked areas', 'known blocked areas', 'zonas bloqueadas', 'peligros', 'obstaculos'],
  coverage: ['unobserved ground', 'unobserved ground shading', 'unexplored ground', 'coverage', 'terreno sin observar', 'cobertura'],
}

export function parseLayerCommand(question) {
  if (typeof question !== 'string') return null
  let text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  text = text.replace(/^[¡!]/, '').replace(/[.!]+$/, '').replace(/\s+/g, ' ')
    .replace(/^(?:eva[, ]+)?(?:please |por favor )?/, '')
    .replace(/(?:,? please|,? por favor)$/, '')
  const match = /^(show|enable|activate|display|turn on|hide|disable|deactivate|turn off|muestra|muestrame|mostrar|activa|activar|enciende|oculta|ocultar|desactiva|apaga|quita) (.+)$/.exec(text)
  if (!match) return null
  const noun = match[2].replace(/^(?:the |el |la |las |los )/, '')
    .replace(/ (?:on the map|en el mapa)$/, '').replace(/ (?:layer|capa)$/, '')
  const layer = Object.keys(layerNames).find(id => layerNames[id].includes(noun))
  if (!layer) return null
  const visible = /^(show|enable|activate|display|turn on|muestra|muestrame|mostrar|activa|activar|enciende)$/.test(match[1])
  const command = { intent: 'set_layer', layer, visible }
  return explicitLayerCommand(question, command) ? command : null
}
export function explicitLayerCommand(question, command) {
  const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const show = /\b(muestra|mostrar|muestrame|activa|activar|enciende|encender|pon|poner|show|enable|activate|display)\b|\bturn on\b/.test(text)
  const hide = /\b(oculta|ocultar|desactiva|desactivar|apaga|apagar|quita|quitar|hide|disable|deactivate|remove)\b|\bturn off\b/.test(text)
  const layerText = text.replace(/\belevation (?=contours?\b)/g, '')
  const layers = Object.keys(aliases).filter(id => aliases[id].test(layerText))
  return show !== hide && layers.length === 1 && layers[0] === command.layer && command.visible === show
    && !/\b(no|not|never|without|don.t|nunca|sin|alterna|toggle|calcula|calculate|calcular|avanza|advance|aumenta|increase|reduce|ignora|ignore|ignorar)\b/.test(text.replace(/sin observar/g, 'desconocido'))
}
