# Asistente de voz Qwen

## Arranque y uso

Requisitos: Ollama abierto con `qwen3:4b`, dependencias del proyecto y un navegador
con reconocimiento de voz (probar Chrome o Edge). Qwen ejecuta inferencia local;
el reconocimiento del navegador puede enviar audio a su servicio y necesitar
Internet. No se implementó transcripción local offline. Las voces instaladas del
sistema se prefieren para leer las respuestas y avisos.
Qwen y los avisos usan el mismo selector `missionSpeechVoice` y velocidad 0.95,
preservando la identidad de voz de la aplicación. El texto de Qwen y su
reconocimiento siguen en español.

En una terminal, ejecutar `npm run ai:serve`; en otra, `npm run dev`. Si Vite ya
estaba abierto antes de configurar la API, reiniciarlo. Opcionalmente ejecutar
`npm run ai:warm` para precargar el modelo. El servicio escucha en
`127.0.0.1:3001`, Ollama en `127.0.0.1:11434`; Vite redirige `/api/assistant`.
La configuración de publicación deberá conservar ese mismo origen para la API.

1. Abrir Jezero o Wildcat Ridge y pulsar **Qwen**.
2. Permitir el micrófono y decir una orden en español. La escucha termina al
   reconocer la frase o después de 12 segundos. No hay escucha permanente.
3. La orden reconocida se muestra como comprobante, no como historial de chat.
   Qwen consulta o actúa, confirma por voz y presenta subtítulos.
4. **Detener**, **Escape**, cerrar el panel o cambiar de página interrumpen la
   captura, solicitud y lectura. **Explicar ruta** permite consultar el motivo
   con un botón, incluso si el reconocimiento no está disponible.

## Órdenes para la demo

| Orden de ejemplo | Efecto |
| --- | --- |
| Muestra pendientes / Apaga pendientes | Capa de pendientes |
| Muestra geología / Oculta geología | Geología interpretada |
| Activa calor / Oculta calor | Incidencia solar modelada, no temperatura medida |
| Muestra curvas de nivel | Contornos de elevación |
| Muestra la capa de elevación | Colores de elevación |
| Oculta la imagen orbital | Textura orbital |
| Muestra la ruta / Oculta la ruta | Línea de ruta calculada |
| Muestra las zonas bloqueadas | Peligros conocidos |
| Muestra terreno sin observar | Sombreado de cobertura observada |
| Por qué se eligió esta ruta | Criterio y restricciones del cálculo |
| Por qué no puedo hacer esta ruta | Motivo de fallo o recursos limitantes |
| Cuánto oxígeno me queda | Autonomía del mismo estado del HUD |
| Cuánto tarda la ida y la vuelta | Tiempos de la última planificación |

Dar una orden por pulsación. «Activa esa capa», «alterna geología» y órdenes
múltiples se rechazan pidiendo una petición explícita. Cambiar visibilidad no
modifica restricciones ni habilita un recorrido limitado por recursos.

## Contrato de implementación

- `MapLayerProvider`: preferencias compartidas por UI y asistente; `useTerrainLayers`
  sincroniza esas preferencias con Cesium. El planificador no depende de ellas.
- `POST /api/assistant/intent`: Qwen devuelve una intención estructurada; se valida
  contra capas permitidas, booleanos y presencia explícita de capa/dirección en
  el texto. No hay código arbitrario ni ejecución mediante DOM.
- `POST /api/assistant/explain`: Qwen selecciona y ordena razones generadas desde
  la evaluación real de la misión. El cliente solo reproduce razones conocidas;
  incluye siempre recursos y prioriza su explicación cuando impiden recorrer.
  No se atribuyen a geología/calor/terremotos decisiones que A* no utiliza.
- Un fallo de extremo agrupa cobertura, pendiente y bloqueo; la explicación
  mantiene esa incertidumbre. Un fallo de búsqueda no prueba inexistencia global.
- `voiceSession`: reconocimiento `es-MX`, una frase, cancelación con AbortController,
  timeout total de consulta de 35 segundos, voz por frases y subtítulos. Los
  decimales se preservan al dividir el texto para hablar.
- `missionAudio`: subtítulos de avisos, suspensión mientras el asistente captura
  o habla, y reanudación de avisos recibidos durante ese intervalo. Una nueva
  advertencia interrumpe al asistente y conserva prioridad.
- Se rechazan respuestas de misión obsoletas si el estado cambia durante la
  consulta; pausar Traverse ayuda a realizar preguntas durante un recorrido.

## Comprobación

`npm run ai:check` evalúa 25 órdenes frente a Qwen real. Las pruebas de Node
verifican validación, cancelación, coherencia de cifras, control de capas,
razones, captura, errores y subtítulos. Las pruebas de callbacks no sustituyen
probar el micrófono físico ni garantizan el servicio de voz de un navegador.

Diseño: extensión Operate de la interfaz existente, sin paleta nueva ni chatbox.
Botón Qwen en el riel, panel en el mismo espacio de Information/Alerts/Map view,
subtítulos sobre los instrumentos. Los controles principales tienen 52 px de
altura; se preservan foco y acceso por teclado. El texto largo puede desplazarse
como alternativa a la voz. No se modifican los tokens de DESIGN.md.

Revisión de acabado independiente: **ship**, sobre capturas 1243×699,
768×1024, 768×600 y 390×843. Se verificaron la explicación con ruta calculada,
el estado sin ruta, los subtítulos sobre el progreso y la disposición del riel
con cinco botones. Detector mecánico sin hallazgos; 75 pruebas, lint y builds
general/independiente correctos. La revisión no certifica reconocimiento físico
del micrófono ni usabilidad con traje espacial.
