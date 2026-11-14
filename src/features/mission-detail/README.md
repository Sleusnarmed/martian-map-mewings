# Gerardo · Full-screen mission interface

Contexto principal: `Context.md`. Rama local: `codex/gerardo-ficha-hud-voz`.

## Ejecutar

```sh
npm run dev -- --host 127.0.0.1
```

Abrir **http://127.0.0.1:5173/mission-demo.html**. Es una entrada independiente; la app común conserva su entrada.

```sh
npm run lint
npx vite build --config vite.mission.config.js
npx vite preview --config vite.mission.config.js --host 127.0.0.1
```

La salida está en `dist/mission-detail/mission-demo.html`. Un build normal puede limpiar `dist`, por lo que conviene regenerar esta demo después.

## Uso de la demo

- El mapa es un fondo negro que cubre toda la pantalla y dice **Placeholder**. No contiene ruta, escala, coordenadas, marcador ni telemetría real.
- Syrtis Major, Jezero y Wildcat Ridge son botones de texto sin borde. Abren la ficha correspondiente; no desplazan a la tripulación.
- El panel inicia **abierto** con cuatro pestañas horizontales: Route, Science, Telemetry, Alerts. El botón lateral lo oculta completo y se convierte en Information para recuperarlo. Conserva la pestaña y la página.
- Route tiene 2 páginas, Science 3, Telemetry 2 y Alerts 2, con Previous/Next. La última página de Science sustituye Next por NASA source, con un objetivo táctil amplio.
- Aviso, siguiente referencia, distancia, margen de regreso, autonomía de oxígeno, Voice y Return permanecen fuera del panel.
- Simulation es un disclosure de pruebas, cerrado inicialmente. Permite elegir los cuatro escenarios y alternar No data.
- Return cambia a la muestra de regreso y abre Route; el aviso abre Alerts. La voz no se desmonta al cerrar el panel o cambiar pestañas.
- Las pestañas aceptan flechas izquierda/derecha y Home/End. El control de colapsar mantiene su nodo/foco al cambiar de estado.

El diseño principal se comprueba en tabletas 1024×768, 1280×800, 768×1024 y en la vista de la app de aproximadamente 774×763. Las páginas cortas evitan scroll en esos tamaños. En tamaños menores o con texto ampliado se conserva overflow interno accesible.

## Identidad y alcance

Se conserva la paleta existente de Space Apps. Por petición del usuario el mapa placeholder es negro; no se dibuja cartografía ficticia. La guía [NASA Graphic Standards](https://www.nasa.gov/nasa-brand-center/brand-guidelines/) informa las funciones tipográficas: Inter para títulos, Public Sans para interfaz/texto y DM Mono para mediciones. Las fuentes son locales y conservan sus licencias. No hay header ni logos visibles.

Ver `assets/SOURCES.md`, `DESIGN.md` y `.impeccable/design.json`. Esta es una demo de diseño para una futura aplicación; no es hardware ni navegación certificados para operaciones EVA.

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
  onInspectStop={inspectWildcatRidge}
/>
<MissionHUD
  mission={missionState}
  onReturn={requestReturn}
  onOpenRoute={openRouteInformation}
  onOpenAlerts={openAlertInformation}
/>
```

Sustituir solamente `RouteMapPlaceholder` por el mapa compartido de Vlado y conservar los overlays. El mapa ocupa todo el viewport, no una columna. No montar otro Viewer. `mission-detail.css` define fuentes, paleta y controles; `tablet-mission.css` define la composición flotante. Cambiar de región/pestaña pertenece al estado de interfaz; la posición y los cálculos pertenecen al estado de misión.

### Datos mínimos

| Campo de `mission` | Tipo / unidad |
|---|---|
| `id` | ID de escenario o instantánea |
| `mode` | `outbound` o `return` |
| `status` | `in-progress` o `arrived` |
| `nextWaypointName` | Nombre o `null` |
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

`SpeechSynthesis` lee exactamente `notice.text` desde el botón Voice; el mismo botón pasa a Stop. No usa micrófono, LLM ni clave API. Se cancela la voz al cambiar de mensaje. Las voces dependen del dispositivo; conservar el texto como respaldo. Un error o ausencia de audio se indica junto al control. La cancelación afecta la cola de síntesis de la página, por lo que conviene centralizar la voz si otro componente la usa.

La foto histórica de Wildcat Ridge se carga desde [NASA](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/), mantiene crédito, fecha y sol, y ofrece fallback en caso de error. Las fuentes tipográficas y sus licencias están empaquetadas localmente. El contexto regional enlaza [Mars Trek](https://trek.nasa.gov/mars/).
