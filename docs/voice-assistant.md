# EVA voice assistant

## Start and use

Open Ollama with the installed local model. In separate terminals run
`npm run ai:serve` and `npm run dev`. Restart the adapter after server code
changes. Optional: `npm run ai:warm` preloads the model.

Select **Input: ES** for Spanish or **Input: EN** for English before speaking.
Press **EVA**, allow microphone access, and give one command.
The preference is remembered on this browser. During microphone permission and
startup, **Starting microphone…** is shown; **Listening…** appears only after
the recognition service confirms it has started. A microphone signal meter
indicates whether audio is reaching the browser. After recognition,
**EVA is thinking…** remains visible through classification and explanation.
**Speaking…** accompanies the spoken reply and English subtitles.
Press EVA again or Escape to stop.

EVA does not open a panel, replace Information, or display a chat history.
Errors and speech-output fallbacks appear in the subtitle area and can be
dismissed. New warnings interrupt EVA so alert audio retains priority.

All UI, accessible labels, notifications, response templates and spoken replies
are in English. Spanish requests still produce English replies. Recognition
uses the selected locale (`es-MX` or `en-US`).
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
- `voiceSession` allows 30 seconds for permission/startup, 20 seconds for listening
  after service confirmation, and a 35-second overall assistant-request deadline,
  cancellation and sentence-linked subtitles. Output uses `en-US`, the shared
  application voice identity and reading rate 0.95.
- `microphoneInput` checks microphone permission and samples local signal energy.
  It does not record or store audio. Cancellation and recognition completion stop
  all media tracks, the signal timer and its audio context, including late grants.
  No-speech errors distinguish silence from detected audio without transcription;
  interim results never execute commands. Only confirmed results are submitted.
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

## Microphone troubleshooting

If speech is not detected, first select Input ES or EN to match what you will
say. Wait for Listening rather than speaking during Starting microphone.
The input meter uses a perceptual scale so quiet input is visible; local signal
energy above RMS 0.001 counts as audio, not as proof of intelligible speech.

If the input remains silent or low, check Windows Settings → System → Sound →
Input: select the intended microphone, ensure it is not muted, and test its
input volume. Then verify Edge Settings → Site permissions → Microphone uses
that input. An existing Allow permission normally produces no new prompt.
If the meter moves but recognition returns no words, check the selected speech
language and the recognition service's Internet access. After code updates,
reload the page so an existing voice session is replaced.

Microphone regression coverage: 85 total tests, including delayed permission,
cancellation cleanup, service-confirmed listening, selected locale, interim
versus final results, permission errors and quiet-input signal scaling.
Scoped diagnostic UI finish review: **ship**. Desktop and mobile language/error
controls were reviewed; this is not evidence that the physical no-speech incident
is resolved. A successful Windows input test and retry in Edge remain required.

Earlier English/EVA interface finish review: **ship**. Desktop, mobile and portrait listening states preserve
the map and open Information panel. Labelled fixtures verify the thinking
indicator, shared layer mutation and English response fallback; they do not
establish physical microphone transcription or audible playback. The final
real-model check passed 40/40 bilingual requests with English adapter replies.
At that milestone, 77 tests, lint and both app/independent builds passed; 17 focused tests also
passed after the fallback-copy correction. The manual UI detector found no issues.
