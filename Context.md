# Proyecto NASA | Contexto general para el equipo

**NASA Space Apps Challenge 2026 · Interplanetary Survival Guide: Martian Map**  
**Secuencia visual confirmada:** Syrtis Major → Jezero → Wildcat Ridge. Se presentará un plano visual de Syrtis Major como contexto regional; al acercar, la visualización se centrará solamente en Jezero y Wildcat Ridge para la demo. Esta secuencia representa niveles de acercamiento; la excursión sigue siendo local dentro de Jezero.
**Decisión confirmada:** la demo será una excursión simulada en Jezero, con destino científico en Wildcat Ridge. El equipo construirá una ruta local de ida y regreso y un asistente que pueda hablarle al astronauta. Las coordenadas de inicio, el trazado y la implementación de voz se cierran durante la integración.
**Repositorio del equipo:** [martian-map-mewings](https://github.com/Sleusnarmed/martian-map-mewings). GitHub devolvió 404 al consultar el repositorio, así que la estructura y las versiones del código quedan por confirmar con el equipo.

## 1. El reto y nuestro problema

El [reto oficial](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/?tab=details) pide una vista integrada y por capas de un lugar o trayecto marciano que ayude a una persona a planear y realizar una caminata con un objetivo científico. Propone combinar datos de varias misiones de NASA y considerar al menos tres tipos de datos. El formato es abierto: mapa, aplicación de tableta, interfaz tipo visor u otro. La seguridad de la tripulación orienta las decisiones sobre movilidad con traje y equipo, obstáculos, condiciones ambientales y posible apoyo robótico.

Una pareja de astronautas necesita saber **cómo llegar a una parada científica, reconocerla y volver al punto de partida conservando una reserva de tiempo**. Para responderlo hay que relacionar mapas orbitales, elevación, geología, evidencia de superficie y condiciones ambientales. El producto debe hacer visible qué se conoce de cada tramo, de dónde sale esa información y qué partes dependen de supuestos de la excursión.

## 2. Qué construiremos

**El proyecto es una aplicación web para planear y ensayar una excursión científica de dos astronautas por la superficie de Marte.** La demo usa Jezero como región y Wildcat Ridge como destino. La salida parte de un punto simulado dentro de Jezero. «Jezero → Wildcat Ridge» identifica el área y su destino científico, por lo que el trazado se define dentro del cráter.

El astronauta comienza en el plano visual de Syrtis Major, se acerca a Jezero y después a Wildcat Ridge. Allí consulta el terreno y abre la ruta hacia el afloramiento. El visor simulado muestra la siguiente referencia, el regreso y la reserva de tiempo. El asistente lee instrucciones y puede responder preguntas acotadas usando los mismos datos del mapa y el visor. Una demora simulada permite demostrar qué cambia y por qué conviene revisar el regreso.

## 3. Alcance para las 24 horas

| Módulo | Entrega de la demo |
|---|---|
| Inicio y fuentes | Explicar la excursión, el objetivo científico y los datos que respaldan cada vista. |
| Globo y filtros | Plano visual de Syrtis Major en Cesium como contexto regional, con acercamiento a Jezero y después a Wildcat Ridge. El detalle de la demo se limita a Jezero y Wildcat Ridge, con filtros para las capas disponibles. |
| Detalle regional | Ficha de Jezero y Wildcat Ridge con geología, foto de Perseverance, objetivo y procedencia. |
| Ruta y regreso | Un trazado local, punto de salida simulado, waypoint intermedio si es útil y destino. El regreso puede invertir el trazado de ida. Mostrar distancia, tiempos y avisos respaldados por el terreno o etiquetados como simulación. |
| Primera persona | HUD simulado, avance por puntos, siguiente referencia, distancia restante por ruta, orientación de regreso y foto atribuida en el destino. Si el terreno 3D está listo, usar el mismo trazado para la cámara a nivel de suelo. |
| Voz e IA | Lectura audible y subtítulos de los avisos de misión. Prototipo conversacional con preguntas acotadas sobre ruta, regreso y fuente del dato. El texto permite demostrarlo con independencia del micrófono. |
| Ambiente | Mostrar una observación histórica MEDA si queda procesada y atribuida. Los avisos de condiciones del escenario llevan su etiqueta de simulación. |

Comparación A/B, detección visual de objetos, seguimiento en vivo y gafas físicas quedan fuera de la primera entrega. Una ruta integrada cubre la historia principal.

## 4. Cómo se orienta y decide la tripulación

1. Explora el plano visual de Syrtis Major, se acerca a Jezero y abre el destino Wildcat Ridge siguiendo esa secuencia visual.
2. Identifica el inicio, el destino científico y el trazado de ida y vuelta. Consulta pendiente y cobertura si están disponibles.
3. Inicia la simulación y avanza al siguiente punto. El mapa, el HUD y el asistente reflejan la misma posición simulada.
4. Introduce una demora y escucha qué cambió en el margen de regreso. El astronauta puede seleccionar «Regresar» y seguir los puntos en sentido inverso.
5. En una ejecución sin demora, llega al objetivo y abre la imagen de Mastcam-Z con su crédito.

**Regla del ejercicio.** Margen = presupuesto − tiempo transcurrido − tiempo estimado de regreso desde la posición simulada. Si el margen queda por debajo de la reserva mínima acordada, mostrar «Margen por debajo de la reserva del ejercicio» y ofrecer el regreso. Ejemplo simulado: 60 min de presupuesto, 20 min de ida y 20 min de vuelta. Al sumar 10 min de observación y 8 min de demora quedan 2 min. Una reserva mínima de 5 min activa el aviso. Mantener el cálculo en código y declarar los supuestos, incluyendo el ritmo y el origen de la geometría. La decisión corresponde al ejercicio.

## 5. Inventario de recursos y datos

### Recursos que comparte el reto

| Recurso | Aplicación en el proyecto |
|---|---|
| [Mars Trek, NASA/JPL](https://trek.nasa.gov/mars/) y [catálogo WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) | Base orbital y exploración de capas de Marte. Probar un mosaico global y una capa local. Verificar GetCapabilities, extensión, proyección, matriz de teselas y acceso desde navegador. |
| [Cartografía planetaria USGS–NASA](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars) | Catálogo y contexto geológico. Para Jezero, priorizar el [mapa SIM 3464 de Jezero y Nili Planum](https://doi.org/10.3133/sim3464), escala 1:75 000, con una leyenda recortada al área. |
| [Ruta propuesta de Curiosity por Mount Sharp](https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/) | Referencia para explicar paradas y objetivos sobre un trayecto anotado. Corresponde a Gale. |
| [NASA Worldview](https://worldview.earthdata.nasa.gov/) | Referencia de interfaz para capas, fuentes y fechas. Sus observaciones son de la Tierra. |
| [Galería de imágenes de Perseverance](https://mars.nasa.gov/mars2020/multimedia/raw-images/) | Evidencia de superficie. Buscar por sol y cámara y comprobar relación con el punto antes de mostrarla en el visor. |

[Lista oficial de recursos del reto](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/?tab=resources)

### Productos concretos para desarrollar el caso Jezero

| Producto | Misión o fuente | Uso y estado |
|---|---|---|
| Mosaico global Viking o MGS MOC Atlas | NASA/JPL Mars Trek | Candidatos identificados para el globo. Elegir uno y preparar respaldo local liviano si la carga WMTS falla. |
| [DEM CTX de Jezero y ortomosaico asociado](https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic) | MRO / CTX · USGS Astrogeology | Elevación de 20 m/píxel e imagen orbital de 5 m/píxel. Preparar un recorte alineado, perfil y pendientes por tramo. |
| [HiRISE DTM y ortoimágenes](https://stac.astrogeology.usgs.gov/docs/data/mars/hirise_dtms/) | MRO / HiRISE · USGS | Cobertura local por verificar. Un mosaico visual de alta resolución y un modelo de alturas son productos distintos. |
| [Topografía MOLA](https://pds-geosciences.wustl.edu/missions/mgs/mola.html) | Mars Global Surveyor | Contexto topográfico global. El DEM CTX es la primera opción para la ruta de Jezero. |
| [Mosaico de Wildcat Ridge](https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/) y [mapa de Perseverance](https://science.nasa.gov/mission/mars-2020-perseverance/location-map/) | Mars 2020 / Mastcam-Z | Mosaico del sol 518, 4 de agosto de 2022. Usar la ficha publicada con crédito y comprobar la ubicación de la parada. Identificar las imágenes adicionales por cámara, sol y fuente. |
| [Archivo MEDA](https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html) e [índice de presión candidato](https://atmos-ah-vs.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/logs/MARS2020_MEDA_PS_Derived_del7.htm) | Mars 2020 / Perseverance | El índice registra presión para el sol 518. Extraer una ventana con hora local marciana, unidad, lugar y calidad. Temperatura, viento, humedad y polvo dependen de cobertura y calidad de los productos seleccionados. Coincidir en sol no garantiza que foto y medición se tomaran a la misma hora. |
| [Evento solar observado por Curiosity](https://science.nasa.gov/resource/curiosity-sees-specks-caused-by-2024-solar-storm-while-recording-a-wind-gust-on-mars/) | Mars Science Laboratory / Curiosity · Gale, mayo de 2024 | Contexto de clima espacial con su lugar y fecha. Para ensayar una alerta en Jezero, definir un evento de simulación. Registrar por separado cualquier producto de dosis y su instrumento. |

Nuestra meta de datos es conectar en la excursión **imagen óptica, topografía y geología**, más una observación atmosférica si queda procesada. Preservar por capa el enlace al producto, instrumento, crédito, fecha o sol, resolución, cobertura y recorte aplicado. Mostrar «Sin datos para esta ventana» cuando corresponda. Etiquetar cada valor como **observación histórica**, **cálculo derivado** o **supuesto de simulación**.

## 6. Base técnica y contrato común

- **GitHub:** ramas por componente y cambios pequeños. La persona de integración coordina React Router, cambios al contrato y dependencias. Acordar versión de Node, gestor de paquetes y archivo de bloqueo a partir del repositorio.
- **React + Vite + React Router:** inicio, mapa y vista de recorrido. Mantener el Viewer montado dentro del área de misión y compartir selección via Context/Reducer o el mecanismo que el repositorio ya use.
- **Cesium:** un Viewer de Marte, con convención planetaria coherente para imagen, posición y distancia. El mosaico orbital se carga como imagen. Para relieve geométrico, recortar y preparar el DEM como terreno compatible o una malla local. Un sombreado sirve como capa visual. [API WMTS de Mars Trek](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) · [CesiumTerrainProvider](https://cesium.com/learn/cesiumjs/ref-doc/CesiumTerrainProvider.html).
- **Anime.js y Tailwind:** transiciones de interfaz y estilos comunes. Cesium mueve la cámara. Definir contraste, capas visibles y estados de aviso compartidos.
- **Preparación de datos:** QGIS/GDAL para recortes y proyecciones. CSV de MEDA procesado a JSON pequeño. Cargar texturas, fotos y modelo de IA solo al abrir la región o función correspondiente.

| Registro | Campos mínimos |
|---|---|
| Región | ID, nombre, límites, centro, capas disponibles y enlaces de procedencia. |
| Ruta y tramo | ID, región, puntos ordenados, sentido, distancia en metros, duración en segundos, indicador del terreno y origen del cálculo. |
| Parada | ID, posición, objetivo, foto o evidencia, cámara, sol y crédito cuando aplique. |
| Observación | Variable, valor y unidad, sol/fecha, referencia horaria, lugar, cobertura, calidad y fuente. |
| Escenario | Tripulación, ritmo supuesto, presupuesto y reserva en segundos, demora, visibilidad y apoyo robótico si se usa. |

Acordar longitud positiva al este en grados, convención de latitud, referencia de alturas y transformación al mapa local en metros. Definir en un solo sitio cómo se convierten coordenadas para Cesium. Compartir `selectedRegionId`, `activeRouteId`, `activeWaypointId`, `scenarioId` y modo ida/regreso. El avance de waypoint o el cambio a regreso actualiza el trazado, los tiempos, los avisos, el HUD y la voz desde el mismo estado. La ruta puede usar el ID `jezero-wildcat-ridge` en la muestra compartida.

### Asistente por voz

- **Primera entrega:** botón «Escuchar instrucciones» en el HUD. La interfaz lee mensajes generados a partir del estado de misión y conserva el texto visible. Añadir reproducir y silenciar. Informar disponibilidad de audio y conservar el texto como respaldo.
- **Prototipo conversacional:** empezar con botones o texto para «¿Cuál es la siguiente parada?», «¿Cuánto me queda para volver?» y «¿Por qué cambió el aviso?». Conectar un LLM solo si la lectura de voz y el flujo principal ya funcionan. Si se usa un proveedor externo, llamar desde un servicio del equipo y guardar la clave del lado servidor.
- **Entrada por micrófono:** mejora si el equipo puede probar permiso, idioma y transcripción en el navegador de la demo. El mismo componente debe permitir escribir o seleccionar la pregunta.
- **Datos que recibe el asistente:** punto activo, siguiente punto, distancia por ruta, modo ida/regreso, margen y reserva ya calculados, aviso y enlaces de evidencia disponibles. El LLM redacta con estos campos, responde «dato no disponible» cuando falte información y conserva el significado del aviso. La app calcula la ruta y el margen. Si se muestran respuestas por reglas, describirlas como guion o reglas, y declarar IA solo donde se haya usado.

Ejemplo de salida audible en inglés para el demo: “You have two minutes of return margin. The exercise requires five. Review your return route.” El mensaje debe salir del mismo estado que presentan el mapa y el HUD.

## 7. Responsables y primera integración

| Persona | Entrega | Primera pieza independiente |
|---|---|---|
| Héctor | Inicio, explicación de la misión y recursos NASA. | Pantalla con enlaces y créditos por fuente. Puede preparar el primer registro MEDA si se acuerda. |
| Vlado | Globo Cesium, rotación, regiones clicables y cámara. | Presentar Syrtis Major, acercar a Jezero y Wildcat Ridge y comunicar `selectedRegionId`. |
| Eduardo | Filtros por región y estado compartido. Se propone coordinar integración. | Capas activas y estado visible de la misión, conectado al Viewer de Vlado. |
| Gerardo | Ficha de Jezero y Wildcat Ridge. Se propone que implemente el HUD y su salida de voz. | Componente de detalle con foto y un aviso reproducible a partir del estado compartido. |
| José | Cartografía, ruta simulada y regreso. | Trazado y waypoints, métricas, lógica de reserva y causa del aviso. Entrega los campos que narrará el asistente. |
| Sexto integrante, nombre pendiente | Documentación, rúbrica, créditos, guion y preparación del envío. | Registro de decisiones y fuentes. Confirma responsables de voz, MEDA y con quién se integra el LLM. |

**Primeros 45–60 minutos:** confirmar responsables propuestos, acordar un conjunto único de datos de ejemplo marcado como simulado y decidir qué archivos compartirá cada módulo. La ruta parte del inicio simulado y termina en Wildcat Ridge. Usen los mismos IDs y unidades.

**A las 2–3 horas:** abrir el plano de Syrtis Major, acercar a Jezero y Wildcat Ridge, ver el trazado, avanzar un waypoint, añadir una demora y leer o escuchar el cambio de margen. Después sustituir las piezas de ejemplo por las fuentes preparadas. Reservar el último bloque para el recorrido de demo, el enlace público y el envío.

## 8. Evaluación y entrega

Los carteles del evento local señalan cinco criterios con igual peso. La demo debe mostrar **impacto** mediante una decisión de la tripulación, **creatividad** al trasladar la ruta del mapa al visor, **validez** con métricas y procedencia explicadas, **relevancia** con datos NASA en el recorrido y **presentación** con una historia breve y enlaces accesibles.

- Completar todos los campos de la plataforma y preparar un enlace público al repositorio, prototipo o sitio.
- Preparar la entrega en inglés. Según la foto del evento, la demo puede ser de hasta 7 diapositivas o un video de 30 s, con opción de video en español subtitulado. Confirmar formato en la guía de envío.
- Declarar los datos NASA y el uso de IA en sus campos y referenciar recursos externos. El Team Owner revisa los términos, confirma originalidad y condiciones de uso de los materiales, y envía.

## 9. Decisiones pendientes

- Fijar las coordenadas de inicio simulado, destino y puntos intermedios después de cruzar la ruta con el DEM y el mapa de Perseverance.
- Acordar el recorte, la capa orbital, el formato de terreno y la hora de primera integración.
- Cerrar los parámetros simulados de tiempos, retorno y reserva, y el papel del rover si aparece en el guion.
- Designar a quienes ejecutarán HUD y voz, confirmarán MEDA y harán la integración final.
- Acordar si alcanza el tiempo para el LLM y el micrófono. La salida audible y los subtítulos son la primera meta.

## 10. Texto para iniciar el chat de cada integrante con su LLM

Adjunta este documento y pega el siguiente bloque. Sustituye el nombre y el módulo por los de la tabla.

> Estamos construyendo **una aplicación para simular una excursión científica en Marte** para el reto *Interplanetary Survival Guide: Martian Map* de NASA Space Apps Challenge 2026. El documento adjunto es el contexto acordado del equipo. Mi nombre es [NOMBRE] y mi entrega es [MÓDULO].
>
> La secuencia visual está fijada en **Syrtis Major → Jezero → Wildcat Ridge**, con un plano regional inicial y detalle limitado a Jezero y Wildcat Ridge. La misión está fijada en **Jezero, con destino en Wildcat Ridge**. Construimos una ruta local simulada de ida y regreso, una vista de superficie con HUD y un asistente que habla usando el estado de la misión. Las coordenadas finas y la configuración de voz están por confirmar. Conserva la diferencia entre datos históricos de NASA, cálculos y supuestos de simulación.
>
> El repositorio es `Sleusnarmed/martian-map-mewings`. Usamos React con Vite, React Router, Cesium, Anime.js y Tailwind. Inspecciona la estructura y los scripts disponibles antes de asumir rutas, versiones o generar componentes. Respeta el Viewer y el estado compartido. Mi módulo debe aceptar el mismo escenario y la misma ruta que usan mapa, HUD y voz.
>
> Ayúdame a entregar mi módulo en pasos cortos. Empieza indicando los archivos que necesito, qué datos recibo, qué datos entrego y cómo mostrar una primera versión con el ejemplo compartido. Cuando falte un dato real, señala el supuesto y la fuente que debe validarse. Al entregar un cambio, incluye cómo conectarlo con el módulo siguiente.

