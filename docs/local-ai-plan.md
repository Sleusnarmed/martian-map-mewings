# Plan de IA local para la demo

Estado: planeación; no instala modelos ni incorpora inferencia a la aplicación.
Máquina indicada por Gerardo: Ryzen 7 250, RTX 5060 con 8 GB de VRAM y 32 GB RAM.

## Inicio de implementación y reparto de trabajo

Rama de trabajo: `codex/gerardo-local-ai`, creada desde `master` después del
merge `2f6c8df`. Esta etapa prepara la integración; todavía no hay un asistente
conectado. En la revisión inicial no se encontró `ollama` en el PATH de la sesión;
esto no descarta una instalación fuera de PATH.

Gerardo prepara Ollama para Windows y descarga `qwen3:4b`. Después de instalar,
abre una terminal nueva y ejecuta:

```powershell
ollama --version
ollama pull qwen3:4b
ollama run qwen3:4b "Responde en español con una frase: estás listo para asistir una misión en Marte."
ollama ps
```

El último comando se ejecuta mientras el modelo sigue cargado y permite revisar
CPU/GPU. La descarga necesita Internet; probar inferencia sin Internet después
no implica que todas las fuentes cartográficas de la aplicación sean offline.
No se necesita entrenar un modelo ni contratar una API para este alcance.

Trabajo delegable al agente, en entregas pequeñas:

1. Servicio Node local: comprobación de disponibilidad, configuración del modelo,
   límites de contexto, cancelación y timeout. Adaptador de misión de solo lectura
   sobre `RouteMissionContext`. Se puede preparar con respuestas de prueba mientras
   se instala Ollama; esas pruebas no sustituyen evaluar el modelo real.
2. Consulta por texto: recursos limitantes, mínimos e ida/vuelta desde los mismos
   resultados del HUD. Validar revisión del estado para evitar respuestas antiguas.
3. Preferencias compartidas de capas: extraer el estado de `useTerrainLayers` y
   conectar herramientas validadas; botones y asistente usan la misma interfaz.
4. Solicitud de ruta con A/B seleccionados y preferencias ya admitidas por el
   planificador. La comparación necesita calcular alternativas explícitas antes
   de describirlas; no basta pedir al modelo que invente una ruta mejor.
5. Salida de voz existente, pruebas de comandos en español y medición con Cesium
   en 3D. Documentar arranque y crear commits por entrega.

Gerardo valida los comandos que quiere presentar y la comodidad del HUD en la
máquina de la demo. El agente puede escribir integración, pruebas, documentación
y scripts de diagnóstico. La elección final del modelo depende de mediciones
con el mapa abierto, no solo de que una respuesta aislada funcione.

Primer entregable recomendado: consultas de texto sobre la misión y control de
capas. Cierre: números iguales al HUD, capas correctas, respuesta clara a datos
faltantes y aplicación operativa si Ollama no está disponible. Después se añaden
rutas y voz. Transcripción local y ampliación del alcance geográfico quedan para
una fase posterior.

## Alcance inicial

El asistente interpreta español, consulta la misión, explica resultados del
planificador, solicita rutas y muestra/oculta capas. La geometría, los tiempos,
el oxígeno y los bloqueos siguen calculándose en código. El modelo no recibe
el DEM completo ni inventa coordenadas, peligros o mediciones ambientales.

Flujo: texto → servicio local → intención/herramienta validada → estado de la
aplicación y A* → resultados comprobados → explicación breve y voz existente.
El descubrimiento y recálculo siguen en el reducer y worker actuales; un LLM no
sustituye su búsqueda. Las imágenes orbitales no son percepción en tiempo real.

## Modelo y presupuesto inicial

Comenzar con Ollama local y `qwen3:4b` Q4_K_M: el catálogo oficial publica un
paquete de 2.5 GB. Comparar después `qwen3:8b` Q4_K_M, 5.2 GB de paquete, si
mejora los comandos y explicaciones sin perjudicar el mapa. Estos tamaños son
archivos, no el consumo total de VRAM: contexto, caché, inferencia, escritorio y
Cesium también ocupan memoria. Son candidatos medibles, no una garantía de ajuste.

Arranque propuesto: contexto de 2048–4096 tokens, una solicitud simultánea,
respuesta corta, modo sin razonamiento largo si lo permite el modelo. Objetivo
de ingeniería: reservar 2–3 GB de VRAM para mapa/escritorio y medir antes de
ajustar. Los 32 GB de RAM permiten considerar descarga parcial a CPU, comparando
la latencia. El primer hito es texto y herramientas; voz de entrada va después.

Ollama debe escuchar solo en loopback. Un pequeño servicio Node local sirve de
adaptador para que React no dependa del formato del proveedor. Configurar modo
local sin nube, precargar el modelo para la demo y comprobar funcionamiento sin
Internet. Registrar modelo, digest y parámetros para poder repetir las pruebas.
llama.cpp/llama-server queda como alternativa si necesitamos controlar GGUF y
capas en GPU más directamente; no se necesitan ambos motores inicialmente.

## Contrato de herramientas

| Herramienta propuesta | Fuente / efecto |
| --- | --- |
| `get_mission_status` | Posición, A/B, recursos, reserva, tiempos, fase y revisión |
| `get_point_info` | Coordenadas seleccionadas, elevación, pendiente y fuente |
| `list_layers` | IDs disponibles, visibilidad y naturaleza del dato |
| `set_layer_visibility` | ID permitido + booleano; modifica preferencias del mapa |
| `request_route` | A/B ya seleccionados + preferencia permitida; usa el worker |
| `compare_routes` | Compara resultados calculados con sus métricas y supuestos |
| `get_science_info` | Fichas locales y referencias documentales de Jezero/Wildcat |

Cada llamada lleva revisión de misión y un ID. Rechazar resultados obsoletos,
argumentos fuera de esquema o capas desconocidas. Un JSON bien formado aún
necesita validación semántica. El modelo propone llamadas; el código las ejecuta.
Iniciar, avanzar o alterar límites críticos queda en los controles explícitos.

Para las capas, extraer las preferencias de `useTerrainLayers` a un contexto de
presentación compartido y ofrecer el mismo dispatcher a botones y asistente.
Así se evita controlar el mapa mediante texto libre o búsquedas de elementos DOM.
Los valores numéricos de la respuesta final deben proceder del estado validado;
usar plantillas para faltantes/mínimos y permitir al modelo explicar el motivo.

## Orden de implementación y criterios de cierre

1. Medir mapa solo y Ollama solo: VRAM/RAM, latencia de inicio y respuesta.
   Repetir con ambos en 3D y moviendo la cámara. Elegir 4B u 8B por evidencia.
2. Implementar adaptador de lectura y probar «¿puedo volver?», «¿qué limita esta
   ruta?» y «¿cuánto tarda ida/vuelta?». Ningún número debe divergir del HUD.
3. Agregar acciones de capas: «muestra pendientes», «oculta geología», «activa
   calor». Explicar que calor es incidencia solar modelada y MEDA es histórico.
4. Conectar solicitud y comparación de rutas. «Más segura» debe explicarse como
   menor exposición según las métricas disponibles; mostrar por qué, no prometer
   seguridad absoluta. Las limitadas por recursos siguen como vista previa.
5. Conectar la salida de voz actual. Evaluar transcripción local después, para
   que la captura de voz no dependa de un servicio remoto del navegador.
6. Opcional: recuperación de contexto sobre documentos locales. Para el pequeño
   corpus inicial bastan fichas/JSON con fuentes; añadir embeddings si el corpus
   crece, antes de considerar entrenamiento o ajuste fino.

Preparar al menos 25 frases de prueba en español: sinónimos de capas, destinos
ambiguos, recursos insuficientes, datos faltantes, petición de información sin
fuente, cambios de misión durante la respuesta y órdenes no soportadas. Medir
exactitud de intención, argumentos, consistencia numérica, latencia y estabilidad
de la navegación. Ante tiempo agotado o motor apagado, mantener botones y avisos
deterministas operativos; la IA debe poder descargarse de memoria cuando no se use.

## El límite de 6 km

Es una protección del prototipo sobre la separación directa A/B, no una ley de
Marte ni el consumo de recursos. La ruta real puede ser más larga por desvíos.
La búsqueda está acotada a unas 161×161 celdas, pero muestrear enlaces y buscar
ida/regresos también cuesta tiempo. Eliminar el límite sin reemplazo puede dar
una cuadrícula muy gruesa o búsquedas caras y perder corredores estrechos.

Evolución recomendada: presupuesto de celdas/tiempo y planificación jerárquica,
con un corredor regional y refinamiento local. Separar «no hay datos», «no se
encontró ruta» y «se agotó el presupuesto de búsqueda». El LLM solicita y explica
esos resultados; ampliar el alcance del planificador es una tarea independiente.
El guard de 6 km permanece en esta entrega porque se consultó su necesidad,
sin pedir eliminarlo.

## Fuentes verificadas

- [Ollama Qwen3 4B](https://ollama.com/library/qwen3:4b) y
  [8B](https://ollama.com/library/qwen3:8b): tamaños, cuantización y capacidades.
- [Tool calling](https://docs.ollama.com/capabilities/tool-calling) y
  [Structured outputs](https://docs.ollama.com/capabilities/structured-outputs):
  interfaces para llamadas y esquemas. Son opciones de integración, no garantías
  de que el modelo ejecute correctamente cualquier instrucción.
- [Ollama local FAQ](https://docs.ollama.com/faq): modo local, contexto y consulta
  de CPU/GPU mediante `ollama ps`.
- [llama.cpp server](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md).
