# EVA voice assistant

## Start and use

Open Ollama with the installed local model. In separate terminals run
`npm run ai:serve` and `npm run dev`. Restart the adapter after server code
changes. Optional: `npm run ai:warm` preloads the model.

Press **EVA**, allow microphone access, and give one command. A compact
**Listening…** indicator appears below the button. After recognition,
**EVA is thinking…** remains visible through classification and explanation.
**Speaking…** accompanies the spoken reply and English subtitles.
Press EVA again or Escape to stop.

EVA does not open a panel, replace Information, or display a chat history.
Errors and speech-output fallbacks appear in the subtitle area and can be
dismissed. New warnings interrupt EVA so alert audio retains priority.

All UI, accessible labels, notifications, response templates and spoken replies
are in English. Spanish requests still produce English replies. Recognition
retains its Spanish input locale (`es-MX`) for the Spanish-speaking demo operator.
The intent service accepts transcribed English or Spanish. Browser recognition
may need Internet; offline transcription is not implemented. Test the operator’s
microphone rather than assuming automatic bilingual recognition.

## Example commands

| English | Spanish |
| --- | --- |
| Show slopes | Muestra pendientes |
| Hide geology | Oculta geología |
| Enable heat | Activa calor |
| Show elevation contours | Muestra curvas de nivel |
| Hide orbital imagery | Oculta la imagen orbital |
| Show the route | Muestra la ruta |
| Hide known blocked areas | Oculta las zonas bloqueadas |
| Show unobserved ground | Muestra terreno sin observar |
| Why was this route chosen? | ¿Por qué se eligió esta ruta? |
| Why can I not traverse this route? | ¿Por qué no puedo hacer el recorrido? |
| How much oxygen do I have left? | ¿Cuánto oxígeno me queda? |

One named layer and an explicit show/hide direction are required. Vague requests,
toggling, multiple commands, resource changes and movement are rejected.
Visibility never changes planning constraints or traversal eligibility.

## Implementation

- `EvaVoiceControls` owns the button and compact activity indicator.
- `MapLayerProvider` shares visibility between buttons and EVA; terrain hooks
  synchronise that state with Cesium.
- `/api/assistant/intent` returns a validated intent. A semantic guard checks
  English or Spanish layer names and visibility directions.
- `/api/assistant/explain` selects verified reasons. English wording and numbers
  come from the planner. Resource-limited routes retain the limiting explanation.
- The underlying model is a server configuration detail. EVA is the only
  assistant name displayed or announced in the application.
- `voiceSession` uses a 12-second listening window, a 35-second overall deadline,
  cancellation and sentence-linked subtitles. Output uses `en-US`, the shared
  application voice identity and reading rate 0.95.
- Mission changes invalidate pending answers. Alert audio is suspended during
  assistant activity and resumes deferred notices afterwards.
- The adapter listens on `127.0.0.1:3001`, using the local model server on
  `127.0.0.1:11434`. Vite proxies under the same origin. A production host must
  preserve that API routing.

## Verification

`npm run ai:check` checks 40 English/Spanish cases against the real model and
the English response adapter. Unit tests cover cancellation, stale answers,
numeric consistency, layer actions, reasons, speech errors and subtitles.
They do not replace testing the physical microphone.

The Operate extension preserves the navy/yellow HUD, map, fonts and focus.
The assistant panel is removed; feedback uses a compact rail status and the
existing subtitle area. No tokens or new raster assets are introduced.

Finish review: **ship**. Desktop, mobile and portrait listening states preserve
the map and open Information panel. Labelled fixtures verify the thinking
indicator, shared layer mutation and English response fallback; they do not
establish physical microphone transcription or audible playback. The final
real-model check passed 40/40 bilingual requests with English adapter replies.
All 77 tests, lint and both app/independent builds passed; 17 focused tests also
passed after the fallback-copy correction. The manual UI detector found no issues.
