# Plan de IA local para la demo

EVA utiliza **Google Gemma 3 4B** (`gemma3:4b`, Q4_K_M) mediante Ollama.
El cambio responde a la restricción del equipo de no usar modelos chinos.
El modelo anterior deja de ser una dependencia activa de esta rama; no se
eliminan modelos instalados en la computadora.

La voz se transcribe localmente con **Whisper base de OpenAI**, convertido a
ONNX por `onnx-community/whisper-base`, cuantizado Q8. Se fija la revisión
`27a07b4b52b3a4c5886134bb4320e93e1a4bbc7c` para reproducibilidad.
Whisper compara los tokens de idioma inglés/español antes de transcribir.
Omitir el idioma en Transformers.js no activaba detección automática: su valor
por defecto era inglés. La implementación evita esa dependencia implícita.

## Alcance implementado

- Un botón EVA permite hablar en español o inglés sin seleccionar idioma.
- La aplicación y las respuestas habladas/subtituladas permanecen en inglés.
- Las órdenes explícitas muestran u ocultan nueve capas del estado compartido.
- Gemma clasifica la petición y selecciona razones verificadas del planificador.
- Las cifras, límites de recursos y elegibilidad del recorrido pertenecen al
  planificador; el modelo no puede inventar reservas, rutas o razones.
- Se rechazan movimiento, cambios de recursos, órdenes múltiples y capas ambiguas.
- Nuevas alertas tienen prioridad; Escape, otra pulsación durante procesamiento
  u ocultar la página cancelan la sesión. Durante escucha, EVA termina la frase.

No hay chat ni historial. El audio se mantiene en memoria y se envía únicamente
al servicio en loopback para transcribir; no se guarda en archivos ni se envía
a un proveedor de reconocimiento de voz. La vista del mapa conserva sus propias
dependencias de imágenes/datos; este cambio no la convierte en una app offline.

## Preparación y arranque

Máquina de Gerardo: Ryzen 7 250, RTX 5060 8 GB VRAM, 32 GB RAM.

```powershell
npm install
ollama pull gemma3:4b
npm run ai:speech:setup
npm run ai:warm
```

La preparación requiere Internet una vez. Gemma ocupa aproximadamente 3.4 GB
de descarga; la caché de voz Q8 observada ocupa alrededor de 80 MB.
La caché `.cache/eva-speech/` no se versiona. Ejecute los comandos desde la raíz
del repositorio. Durante uso, Whisper sólo carga la caché local y usa CPU con
dos hilos para dejar la GPU disponible para Gemma/Cesium.

En terminales separadas:

```powershell
npm run ai:serve
```

```powershell
npm run dev
```

Reinicie `ai:serve` después de cambios en `server/` y recargue el navegador
tras cambios de captura. El adaptador escucha en `127.0.0.1:3001`; Ollama en
`127.0.0.1:11434`. Vite redirige `/api/assistant` bajo el mismo origen.
El despliegue deberá conservar esta API local; subir sólo el frontend no
incluye el asistente ni sus pesos.

## Rendimiento y validación

Gemma usa contexto 2048 para clasificación, salida JSON limitada y temperatura
cero. Las explicaciones seleccionan identificadores, no generan texto libre.
`ai:warm` reduce el arranque en frío; no garantiza latencia constante.
La ejecución observada en Ollama informó `size_vram: 0`: está usando CPU.
No se modificaron drivers ni ajustes globales de la tarjeta gráfica.

`npm run ai:check` valida 40 consultas bilingües, controles de capas y respuestas
en inglés contra el modelo real. Las pruebas Node cubren límites de audio,
fin de frase, cancelación, permisos tardíos, coherencia numérica y subtítulos.
La prueba de integración con audios sintetizados recorre MediaRecorder,
Whisper, Gemma y las capas reales; no sustituye probar el micrófono físico.

La guía de uso y las evidencias vigentes están en
[voice-assistant.md](voice-assistant.md). Los commits conservan el historial de
la implementación anterior.

## Fuentes de los modelos

- [Google: documentación de Gemma](https://ai.google.dev/gemma/docs/core).
- [Catálogo de Gemma 3 4B en Ollama](https://ollama.com/library/gemma3:4b).
- [Modelo original Whisper base de OpenAI](https://huggingface.co/openai/whisper-base).
- [Conversión ONNX utilizada](https://huggingface.co/onnx-community/whisper-base).
