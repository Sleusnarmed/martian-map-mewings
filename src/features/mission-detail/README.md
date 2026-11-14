# Gerardo · Fichas, HUD y voz

Primera entrega independiente para el hackatón. Rama: `codex/gerardo-ficha-hud-voz`.
El contexto principal es `Context.md`. Esta propuesta de conexión aún debe coordinarse con Eduardo y Vlado.

## Identidad visual

El módulo aplica la [guía de marca NASA Space Apps](https://www.spaceappschallenge.org/brand/): base Deep Blue, cabecera Electric Blue, ficha científica blanca y amarillo neón para controles y avisos puntuales. Fira Sans y Overpass se incluyen localmente con sus licencias; el logotipo oficial de Space Apps identifica el evento y se presenta separado del nombre VISTA Mars.

Las fuentes y el SVG se empaquetan en el build. La fotografía científica sigue cargándose por red y conserva su alternativa de error, procedencia y crédito. Ver `assets/SOURCES.md` para los orígenes y `DESIGN.md` en la raíz para reutilizar el sistema visual en otros componentes. Los estilos permanecen limitados al módulo mediante el prefijo `md-`.

## Probar

### Vista de tableta

La demo abre un mapa de ruta **esquemático**, un panel lateral con cuatro pestañas horizontales (Route, Science, Telemetry, Alerts) y un HUD inferior permanente. El mapa y la voz no se desmontan al cambiar de pestaña. Las páginas cortas se recorren con Previous/Next: Route 2, Science 3, Telemetry 2, Alerts 2.

En 1024×768, 1280×800 y 768×1024 se muestran mapa, pestañas y HUD dentro de la pantalla; las nueve páginas se verificaron sin scroll de contenido. En pantallas menores o con ampliación de texto se permite overflow accesible para evitar recortes.

- El aviso, la reserva, el margen limitante, la autonomía de oxígeno y Return permanecen disponibles fuera de las pestañas.
- El selector Exercise cambia entre las cuatro instantáneas; No data ensaya la falta de datos.
- Los controles de zoom, centrar y ajustar manipulan el diagrama. **No son posicionamiento GPS, cartografía validada ni seguimiento en vivo.**
- Cambiar Jezero/Wildcat Ridge abre su ficha. Inspect stop abre la ciencia del destino; no mueve al astronauta.
- La foto, su crédito y las fuentes se consultan en las páginas de Science.
- Las pestañas admiten flechas izquierda/derecha y Home/End; los controles principales de tableta tienen objetivos de al menos 44px.

```sh
npm run dev -- --host 127.0.0.1
```

Abrir **http://127.0.0.1:5173/mission-demo.html**. La página principal sigue perteneciendo a la app común.
La secuencia Syrtis Major → Jezero → Wildcat Ridge se representa como contexto y selección;
el movimiento de cámara y el trazado geográfico pertenecen al módulo del mapa.

```sh
npm run lint
npx vite build --config vite.mission.config.js
npx vite preview --config vite.mission.config.js --host 127.0.0.1
```

La compilación independiente genera `dist/mission-detail/mission-demo.html`.
En preview, abrir `/mission-demo.html` en el puerto que indique Vite.
Un build normal de la app común puede limpiar `dist`, por lo que conviene regenerar esta demo después.

## Escenarios

| Escenario | Margen de tiempo | Margen de oxígeno | Reserva |
|---|---:|---:|---:|
| Recorrido normal | 20 min | 20 min | 5 min |
| Demora de 8 min | 2 min | 2 min | 5 min |
| Llegada al destino | 20 min | 15 min | 5 min |
| Demora + alerta sísmica simulada | 2 min | 1 min | 5 min |

«Test missing data» permite comprobar campos ausentes: no se sustituyen por cero ni se muestra un estado favorable.
«Return to base» cambia el modo, el siguiente punto y la distancia restante en el adaptador de prueba.
No avanza un reloj ni descuenta oxígeno en vivo; las muestras son instantáneas estáticas.

## Respuesta de José incorporada

José aceptó los tres ejemplos iniciales, pidió considerar oxígeno en el margen de regreso y
añadió un caso de demora con posible peligro sísmico. El cuarto ejemplo usa explícitamente una **alerta simulada**.
No hay una medición ni un pronóstico sísmico de Jezero que respalde ese aviso.

**Propuesta provisional:** expresar oxígeno como autonomía restante estimada en segundos.
No equivale a presión, porcentaje de tanque ni medición de sensores. José debe confirmar el modelo de consumo,
las reservas y cómo afecta el equipo/actividad. La reserva de cinco minutos para ambos márgenes es un supuesto de la demo.

- Margen de tiempo = presupuesto − tiempo transcurrido − duración estimada del regreso.
- Margen de oxígeno = autonomía restante estimada − duración estimada del regreso.
- Margen limitante mostrado = menor de ambos, siempre que ambos estén disponibles.
- Si falta uno, el HUD muestra «No data» e indica datos insuficientes.

Estos cálculos de misión los entrega el módulo de José. El HUD presenta los valores y compara la reserva visualmente;
no determina una ruta nueva ni modifica el aviso recibido. El texto del aviso debe concordar con los valores entregados.

## Conectar los componentes

```jsx
import RegionDetail from './features/mission-detail/RegionDetail.jsx'
import MissionHUD from './features/mission-detail/MissionHUD.jsx'
import './features/mission-detail/mission-detail.css'

<RegionDetail region={selectedRegion} image={surfaceImage} page={sciencePage} />
<MissionHUD
  mission={missionState}
  onReturn={() => dispatch({ type: 'RETURN_REQUESTED' })}
  onOpenRoute={() => selectTab('route')}
  onOpenAlerts={() => selectTab('alerts')}
/>
```

`RETURN_REQUESTED` es un nombre ilustrativo: acordar la acción real con Eduardo.
Los componentes reciben `props`; `MissionDetailDemo.jsx` es solamente el adaptador de prueba.
`MissionInfoPanel.jsx` recibe también `activeTab`, `page`, `onTabChange`, `onPageChange` y `onInspectStop`. Mantener la selección de pestaña/página en el estado de interfaz; la posición y los cálculos pertenecen al estado de misión. `missionPresentation.js` comparte el formato y la comparación del margen entre las vistas.
`RouteMapPlaceholder.jsx` se sustituirá por el Viewer compartido de Vlado: su geometría, contornos y marcador actual son ilustrativos y dependen de las muestras de demo. Los puntos del diagrama no tienen coordenadas geográficas ni escala métrica.
No importar `demo-main.jsx` dentro de la app común ni crear un Viewer adicional.
Los estilos tienen prefijo `md-`; el equipo debe coordinar su relación con los estilos globales.

### `mission`

| Campo | Tipo / unidad |
|---|---|
| `id` | ID de escenario/instantánea |
| `mode` | `outbound` o `return` |
| `status` | En esta versión: `in-progress` o `arrived` |
| `nextWaypointName` | Nombre o `null` |
| `remainingDistanceMeters` | Distancia restante en el modo actual, metros o `null` |
| `returnDurationSeconds` | Duración de regreso desde posición actual, segundos o `null` |
| `returnMarginSeconds` | Margen temporal después del regreso, segundos o `null`; admite valores negativos |
| `oxygenRemainingSeconds` | Autonomía estimada restante, segundos o `null` |
| `oxygenReturnMarginSeconds` | Margen de oxígeno después del regreso, segundos o `null`; admite valores negativos |
| `reserveSeconds` | Reserva mínima del ejercicio, segundos o `null` |
| `notice` | `{ id, title, text, level, provenance }` |

Niveles: `info`, `warning`, `unknown`. Procedencia actual: `simulation`.
Todos los números deben llegar como números finitos; los campos ausentes usan `null`.
IDs de selección propuestos: `jezero` y `wildcat-ridge`. Confirmar estos nombres con Eduardo y Vlado.

### Ficha y evidencia

`region`: `{ id, name, eyebrow, description, objective, geology, source }`.
`image`: `{ src, alt, credit, instrument, date, note, source }`.
La imagen se muestra al seleccionar Wildcat Ridge; si falla la carga, se conserva el enlace de origen.
La foto se obtiene de NASA por red, así que todavía no existe un respaldo offline empaquetado.

## Voz

Usa `SpeechSynthesis` del navegador, sin clave de API ni micrófono. Se activa mediante botón;
el texto visible es exactamente el texto que recibe el sintetizador. Permite detener y volver a escuchar.
La lectura se cancela al cambiar de aviso, escenario o desmontar el componente.
El HUD reinicia `VoiceControls` mediante una `key` asociada al mensaje. Si se integra `VoiceControls` por separado,
usar también `key={notice.text}` para reiniciar el estado visible al cambiar de mensaje.
La cancelación de síntesis afecta la cola de voz de la página: centralizar la voz si otro módulo también la utiliza.
La voz y la pronunciación dependen de las voces instaladas/disponibles. El idioma inicial es inglés (`en-US`).
No se ha conectado un LLM: los mensajes son guiones de los escenarios.

## Validación y pendientes

- Lint y build independiente.
- Revisión en navegador: selección de ambas fichas, cuatro escenarios, regreso y datos faltantes.
- Lectura iniciada desde botón y reinicio de su estado al cambiar de escenario; probar sonido y pronunciación en el equipo de presentación.
- Diseño para escritorio y pantalla pequeña; imagen real cargada con crédito visible.
- Pendientes: contrato final, datos de ruta de José, selección del mapa de Vlado, integración de Eduardo y revisión editorial de las fichas.

## Fuentes

- [NASA · Wildcat Ridge, imagen y contexto](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/).
  Mastcam-Z, sol 518, 4 de agosto de 2022. Crédito: NASA/JPL-Caltech/ASU/MSSS. Imagen con contraste mejorado.
- [MDN · SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

Mauri puede usar este documento para registrar el acuerdo parcial con José y los pendientes de integración.
