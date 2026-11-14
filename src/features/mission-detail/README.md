# Gerardo · Full-screen mission interface

Contexto principal: `Context.md`. Rama local: `codex/gerardo-ficha-hud-voz`.

## Ejecutar

```sh
npm run dev -- --host 127.0.0.1
```

Abrir **http://127.0.0.1:5173/mission-demo.html**. Es una entrada independiente; la app común conserva su entrada.

```sh
npm run lint
node --test src/features/mission-detail/missionAudio.test.js src/features/mission-detail/fadeTransition.test.js
npx vite build --config vite.mission.config.js
npx vite preview --config vite.mission.config.js --host 127.0.0.1
```

La salida está en `dist/mission-detail/mission-demo.html`. Un build normal puede limpiar `dist`, por lo que conviene regenerar esta demo después.

## Uso de la demo

- El mapa es un fondo negro que cubre toda la pantalla y dice **Placeholder**. No contiene ruta, escala, coordenadas, marcador ni telemetría real.
- Syrtis Major, Jezero y Wildcat Ridge son botones de texto sin borde. Abren la ficha correspondiente; no desplazan a la tripulación.
- El panel inicia **abierto** con tres pestañas horizontales: **Route → Telemetry → Science**. Information lo oculta completo y lo recupera conservando pestaña/página.
- Route y Telemetry tienen una sola página. Los siete valores de Telemetry caben sin scroll en las tabletas de referencia. Solo Science utiliza tres páginas con Previous/Next y NASA source en la última.
- La columna derecha mantiene **Information → Alerts → Voice**. Alerts abre un panel independiente; información y alertas comparten el mismo espacio para evitar solapamientos. Los escenarios de demora y la falta de datos revelan Alerts automáticamente.
- Return to base vive dentro de Route. El HUD inferior conserva destino, distancia, margen limitante y autonomía, con etiquetas, valores y notas alineados. Su superficie mide aproximadamente 78px de alto. Cada dato es un botón: destino/distancia abren Route y margen/oxígeno abren Telemetry.
- Encima del HUD hay una línea compacta con solo **A · Base** y **B · Wildcat Ridge**, sin paradas intermedias. El rombo amarillo indica la posición sobre A–B; tocar la línea abre Route. No representa distancia geográfica ni avance en vivo.
- Los fondos de paneles, botones y HUD tienen 70% de opacidad. Los textos, iconos y el foco mantienen su opacidad completa.
- Mission case es un disclosure cerrado inicialmente. Permite elegir los cuatro casos y alternar No data. La pantalla y la voz usan redacción operativa; la procedencia de las muestras permanece en el código y en esta documentación.
- Return selecciona A como destino y abre Route. La posición sobre A–B permanece en la instantánea de partida del regreso; no se simula movimiento. La voz no se desmonta al cerrar paneles o cambiar pestañas.
- Paneles, pestañas, páginas y cambios de ficha tienen fades de salida/entrada. Las entradas rápidas conservan la última selección y no pierden pulsaciones de Next. Con movimiento reducido, el cambio es inmediato y la entrada tiene un fade mínimo.
- La barra lateral desaparece si el contenido cabe. ResizeObserver vuelve a habilitarla cuando el panel tiene overflow real, incluso al cambiar de tamaño o ampliar texto.
- Las pestañas aceptan flechas izquierda/derecha y Home/End. El control de colapsar mantiene su nodo/foco al cambiar de estado. Al entrar desde Alerts, el mapa o el HUD, el foco pasa a la pestaña solicitada después de que Information esté montado y visible.

El diseño principal se comprueba en tabletas 1024×768, 1280×800 y 768×1024. En tamaños menores, poca altura o texto ampliado se conserva overflow interno accesible; no se ocultan controles para forzar todo dentro de la pantalla.

## Identidad y alcance

Se conserva la paleta existente de Space Apps. Por petición del usuario el mapa placeholder es negro; no se dibuja cartografía ficticia. La guía [NASA Graphic Standards](https://www.nasa.gov/nasa-brand-center/brand-guidelines/) informa las funciones tipográficas: Inter para títulos, Public Sans para interfaz/texto y DM Mono para mediciones. Las fuentes son locales y conservan sus licencias. No hay header ni logos visibles.

Ver `assets/SOURCES.md` para fuentes y `DESIGN.md` para la identidad tipográfica/paleta precedente. La composición y los comportamientos actuales se documentan aquí y en el contrato de superficie de `.impeccable/surfaces/`. Esta es una demo de diseño para una futura aplicación; no es hardware ni navegación certificados para operaciones EVA.

## Integración

`MissionDetailDemo.jsx` conecta únicamente las muestras. Los componentes reciben props:

```jsx
<MissionInfoPanel
  mission={missionState}
  region={selectedRegion}
  image={surfaceImage}
  activeTab={activeTab}
  page={page}
  collapsed={!informationOpen}
  onTabChange={selectTab}
  onPageChange={setPage}
  onReturn={requestReturn}
  onInspectStop={inspectWildcatRidge}
/>
<MissionHUD
  mission={missionState}
  onOpenRoute={openRouteInformation}
  onOpenTelemetry={openTelemetryInformation}
/>
<MissionAlerts mission={missionState} open={alertsOpen} onOpenRoute={openRouteInformation} />
<VoiceControls noticeId={missionState.notice?.id} text={missionState.notice?.text} />
```

Sustituir solamente `RouteMapPlaceholder` por el mapa compartido de Vlado y conservar los overlays. El mapa ocupa todo el viewport, no una columna. No montar otro Viewer. `mission-detail.css` define fuentes, paleta y controles; `tablet-mission.css` define la composición flotante. Cambiar de región/pestaña pertenece al estado de interfaz; la posición y los cálculos pertenecen al estado de misión.

### Datos mínimos

| Campo de `mission` | Tipo / unidad |
|---|---|
| `id` | ID de escenario o instantánea |
| `mode` | `outbound` o `return` |
| `status` | `in-progress` o `arrived` |
| `nextWaypointName` | Nombre del destino: Wildcat Ridge al salir, Base al regresar; `null` si no existe |
| `routeProgress` | Posición ilustrativa normalizada sobre A–B: 0 en A, 1 en B; `null` si no existe. Al regresar se conserva esta orientación; no se calcula desde los metros restantes |
| `remainingDistanceMeters` | Metros o `null` |
| `returnDurationSeconds` | Duración de regreso en segundos o `null` |
| `returnMarginSeconds` | Margen temporal tras el regreso, admite negativos |
| `oxygenRemainingSeconds` | Autonomía estimada restante en segundos o `null` |
| `oxygenReturnMarginSeconds` | Margen de oxígeno tras el regreso, admite negativos |
| `reserveSeconds` | Reserva mínima en segundos o `null` |
| `elapsedSeconds`, `budgetSeconds`, `delaySeconds` | Valores de la muestra, segundos o `null` |
| `notice` | `{ id, title, text, level, provenance }` |

Niveles: `info`, `warning`, `unknown`. Procedencia de las muestras: `simulation`. Los números son finitos; usar `null` para datos ausentes. `missionPresentation.js` centraliza formatos y comparación del margen; no calcula una ruta nueva.

`region`: `{ id, name, eyebrow, description, objective, geology, source }`.
`image`: `{ src, alt, credit, instrument, date, note, source }`.

## Acuerdo parcial con José

Se incorporaron tres ejemplos aceptados (normal, demora y llegada), el oxígeno y un cuarto caso de demora con alerta sísmica **simulada**. El modelo de consumo y las reservas siguen por validar con José.

| Muestra | Margen de tiempo | Margen de oxígeno | Reserva |
|---|---:|---:|---:|
| Normal | 20 min | 20 min | 5 min |
| Demora | 2 min | 2 min | 5 min |
| Llegada | 20 min | 15 min | 5 min |
| Demora + alerta sísmica simulada | 2 min | 1 min | 5 min |

Margen temporal = presupuesto − tiempo transcurrido − regreso estimado. Margen de oxígeno = autonomía restante estimada − regreso estimado. La interfaz muestra el menor de ambos cuando ambos y la reserva están disponibles. Si falta información, muestra No data y deshabilita Return cuando no hay duración de regreso. Estos valores son instantáneas: no se avanza un reloj ni se descuenta oxígeno en vivo. No hay medición o pronóstico sísmico de Jezero.

## Voz y fuentes

Cada aviso nuevo (cambio de `notice.id` o `notice.text`) produce dos tonos breves con Web Audio y después lee exactamente `notice.text` mediante SpeechSynthesis. Cambiar pestaña/página o reabrir Alerts no repite la notificación. El controlador cancela tonos, lecturas pendientes y eventos tardíos del aviso anterior.

Voice permite repetir el aviso; durante tonos/lectura pasa a **Mute**. Al pulsarlo, silencia tanto el sonido como la voz y conserva ese silencio para los siguientes avisos. **Muted** permite reactivar el audio y leer el mensaje actual. El control se mantiene montado al cambiar de escenario.

Los navegadores pueden exigir una interacción antes de reproducir audio. En una carga nueva aparece **Enable voice** y la indicación para activarlo; ese mismo botón o la primera interacción habilitan la notificación pendiente, respetando la [política de autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Una denegación o cola que no comienza devuelve un estado recuperable. Si la voz no existe, se conserva el tono; si ningún API existe, se muestra Audio unavailable y el texto permanece en Alerts.

No usa micrófono, LLM ni clave API. Se prefieren voces locales del idioma, pero la disponibilidad y operación sin red dependen del dispositivo y su motor de voz. La cancelación afecta la cola de síntesis de la página: montar un único VoiceControls y centralizar la voz si otro componente la usa. Las siete pruebas de `missionAudio.test.js` cubren silencio persistente, interrupciones, autoplay, APIs ausentes y limpieza de React StrictMode.

Anime.js 4.5 se utiliza en `useFadingView.js` y `fadeTransition.js`: salida de 90ms antes de cambiar/ocultar la vista y entrada de 140ms después. Information y Alerts comparten una transición de presencia; el contenido de Information tiene otra para pestañas, páginas y ficha regional. El panel saliente se mantiene montado hasta completar la salida. Cada nueva petición cancela la anterior, y desmontar invalida callbacks tardíos. `prefers-reduced-motion` aplica el cambio sin espera y conserva una entrada de 60ms. Las seis pruebas de `fadeTransition.test.js` cubren cierre diferido, interrupciones, doble pulsación, cleanup y movimiento reducido. No hay bucles ni animación de mediciones.

La foto histórica de Wildcat Ridge se carga desde [NASA](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/), mantiene crédito, fecha y sol, y ofrece fallback en caso de error. Las fuentes tipográficas y sus licencias están empaquetadas localmente. El contexto regional enlaza [Mars Trek](https://trek.nasa.gov/mars/).
