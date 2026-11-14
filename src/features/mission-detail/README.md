# Gerardo · Full-screen mission interface

Contexto principal: `Context.md`. Rama local: `codex/gerardo-ficha-hud-voz`.

## Ejecutar

```sh
npm run dev -- --host 127.0.0.1
```

Abrir **http://127.0.0.1:5173/mission-demo.html**. Es una entrada independiente; la app común conserva su entrada.

```sh
npm run lint
node --test src/features/mission-detail/missionAudio.test.js
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
- Return to base vive dentro de Route. El HUD inferior conserva siguiente referencia, distancia, margen limitante y autonomía, con etiquetas, valores y notas alineados. Su superficie mide aproximadamente 78px de alto.
- Encima del HUD hay una línea horizontal compacta con Simulated base, Delta lookout y Wildcat Ridge. El rombo amarillo indica una **posición simulada**; tocar la línea abre Route. No representa distancia geográfica ni avance en vivo.
- Los fondos de paneles, botones y HUD tienen 70% de opacidad. Los textos, iconos y el foco mantienen su opacidad completa.
- Simulation es un disclosure de pruebas, cerrado inicialmente. Permite elegir los cuatro escenarios y alternar No data.
- Return cambia a la muestra de regreso y abre Route. La posición de referencia permanece en la instantánea de partida del regreso; no se simula movimiento. La voz no se desmonta al cerrar paneles o cambiar pestañas.
- Las pestañas aceptan flechas izquierda/derecha y Home/End. El control de colapsar mantiene su nodo/foco al cambiar de estado.

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
| `nextWaypointName` | Nombre o `null` |
| `routeProgress` | Posición ilustrativa normalizada 0–1 a lo largo de las tres referencias; `null` si no existe. No se calcula desde los metros restantes |
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

Anime.js 4.5 ya está en uso en `useMissionPanelMotion.js`: un Scope por overlay, opacidad breve para Information y un revelado lateral de 180ms para Alerts. El Scope se revierte al cambiar/cerrar el panel; `prefers-reduced-motion` conserva solo una transición de opacidad de 80ms. No hay bucles ni animación de mediciones. Ver la [integración oficial con React](https://animejs.com/documentation/getting-started/using-with-react).

La foto histórica de Wildcat Ridge se carga desde [NASA](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/), mantiene crédito, fecha y sol, y ofrece fallback en caso de error. Las fuentes tipográficas y sus licencias están empaquetadas localmente. El contexto regional enlaza [Mars Trek](https://trek.nasa.gov/mars/).
