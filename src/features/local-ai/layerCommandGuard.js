const aliases = {
  orbital: /\b(orbital|satelite|textura|satelital|satellite|imagery|texture)\b/, geology: /\b(geologia|geologica|geologico|geology|geological)\b/,
  slopes: /\b(pendiente|pendientes|inclinacion|slopes?|inclination)\b/, heat: /\b(calor|solar|termica|termico|heat|heating|thermal)\b/,
  contours: /\b(curvas? de nivel|contornos|contours?)\b/, elevation: /\b(elevacion|altitud|relieve|elevation|altitude|relief)\b/,
  route: /\b(ruta|recorrido|camino|route|path)\b/, hazards: /\b(bloquead[ao]s?|peligros|obstaculos|bloqueos|blocked|hazards?|obstacles?)\b/,
  coverage: /\b(sin observar|no observado|desconocido|exploracion|cobertura|unobserved|unexplored|unknown|coverage|exploration)\b/,
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
