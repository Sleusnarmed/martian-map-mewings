const aliases = {
  orbital: /\b(orbital|satelite|textura|satelital)\b/, geology: /\b(geologia|geologica|geologico)\b/,
  slopes: /\b(pendiente|pendientes|inclinacion)\b/, heat: /\b(calor|solar|termica|termico)\b/,
  contours: /\b(curvas? de nivel|contornos)\b/, elevation: /\b(elevacion|altitud|relieve)\b/,
  route: /\b(ruta|recorrido|camino)\b/, hazards: /\b(bloquead[ao]s?|peligros|obstaculos|bloqueos)\b/,
  coverage: /\b(sin observar|no observado|desconocido|exploracion|cobertura)\b/,
}
export function explicitLayerCommand(question, command) {
  const text = question.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const show = /\b(muestra|mostrar|muestrame|activa|activar|enciende|encender|pon|poner)\b/.test(text)
  const hide = /\b(oculta|ocultar|desactiva|desactivar|apaga|apagar|quita|quitar)\b/.test(text)
  const layers = Object.keys(aliases).filter(id => aliases[id].test(text))
  return show !== hide && layers.length === 1 && layers[0] === command.layer && command.visible === show
    && !/\b(no|nunca|sin|alterna|calcula|calcular|avanza|aumenta|reduce|ignora|ignorar)\b/.test(text.replace(/sin observar/g, 'desconocido'))
}
