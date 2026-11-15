# EVA voice assistant

## Start and use

Install dependencies, pull `gemma3:4b` in Ollama, and run
`npm run ai:speech:setup` once to download the pinned local Whisper model.
From the repository root, start `npm run ai:serve` and `npm run dev` in separate
terminals. Optional: `npm run ai:warm` preloads Gemma. Restart the adapter after
server changes and reload the browser after capture changes.

Press **EVA**, allow microphone access, wait for **Listening…**, and give one
command in **English or Spanish**. There is no language selector. Pause for
about 1.2 seconds after speaking, or press EVA again to finish the command.
Capture is limited to 20 seconds. **Transcribing…** indicates local speech
recognition; **EVA is thinking…** indicates command interpretation or route
explanation. **Speaking…** accompanies English speech and sentence-linked
English subtitles. The microphone meter shows local input energy.

EVA does not display or read back the raw transcription. Unsupported requests
receive only a short English retry message. Subtitles accompany the response,
while the compact rail indicates transcription and processing status.

Press EVA during startup, transcription, thinking or speaking to cancel.
Escape and hiding the page always cancel. New warning alerts interrupt EVA;
alert audio resumes when the assistant releases it. EVA opens no popup or chat.
Failures use the existing dismissible subtitle area.

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
| Which resources limit this route? | ¿Qué recursos limitan esta ruta? |
| How much oxygen do I have left? | ¿Cuánto oxígeno me queda? |

One named layer and an explicit show/hide direction are required. Ambiguous,
negated or multiple layer commands, toggles, resource changes and movement are
rejected. Visibility never changes planning constraints or traversal eligibility.

## Local models and data flow

- **Google Gemma 3 4B** (`gemma3:4b`, Q4_K_M) classifies commands and selects
  verified route reasons through Ollama. The only assistant name in the UI is EVA.
- **OpenAI Whisper Small**, community ONNX Q8 conversion, revision
  `36050c46d777d46dc4b5f43f6d90574fc38f8732`, compares English/Spanish language
  tokens before transcription. Transformers.js otherwise defaults to English.
- `captureSpeech` uses MediaRecorder and local microphone energy for end-of-phrase
  detection. Browser AudioContext decodes audio, downmixes and resamples to mono
  16 kHz PCM WAV. No Python, ffmpeg or browser speech recognition service is used.
- `/api/assistant/transcribe` accepts bounded WAV audio, at most 20 seconds and
  700 KB. Whisper runs on CPU with two intra-op threads. Runtime loads the local
  `.cache/eva-speech/` cache only; setup is the explicit download step.
- `/api/assistant/intent` validates structured output and explicit layer meaning.
  Complete explicit layer commands such as “show slopes”, “hide geology” and
  “muestra pendientes” use a strict bilingual command parser before Gemma.
  This avoids model classification variability and latency for these commands.
  Other wording and mission questions still use Gemma and the existing guards.
  Misspellings, guessed homophones, negations and compound commands never match
  this shortcut. Visibility commands still require the map to be ready.
  `MapLayerProvider` shares layer visibility with the map buttons and Cesium.
- `/api/assistant/explain` selects verified reason identifiers. English wording
  and numbers come from the planner; limiting resources remain in the reply.
- `voiceSession` allows 30 seconds for microphone setup, up to 50 seconds for
  local transcription and 35 seconds for the assistant request. Server deadlines
  are 45 seconds for transcription and 30 seconds for other requests. Cancellation
  invalidates late results and stops all capture tracks/timers/audio contexts,
  including late permission grants. Decoder work stops at the next generation step.
- TTS uses `en-US` and rate 0.95. EVA and alerts prefer the installed local
  Microsoft Zira female voice, independent of browser voice ordering. If Zira is
  unavailable, the shared selector falls back to another available voice,
  preferring local English speech. No online voice download is required.

Audio exists only in memory, goes to the local adapter and is not logged or
saved by the application. English/Spanish detection chooses between those two
languages per utterance; mixed-language phrases, noise, accents and very short
commands can still be misrecognised. This is demo assistance, not flight-qualified
voice control or autonomous navigation.

The adapter binds to `127.0.0.1:3001`, Ollama to `127.0.0.1:11434`; Vite proxies
requests under the same origin. Model setup needs Internet; inference does not
use a remote speech service. Map imagery may still need network access.
`GET /api/assistant/health` checks that the configured Gemma model is installed;
it is not a microphone or speech-cache readiness test.

## Microphone troubleshooting

Wait for Listening before speaking. If the meter remains still, verify Windows
Settings → System → Sound → Input selects the intended microphone, its volume
is sufficient, and it is not muted. Confirm Edge's site permission and input
device. An existing Allow permission normally produces no new prompt.

If Transcribing fails, run `npm run ai:speech:setup` from the repository root
and restart `ai:serve`. If thinking fails, verify Ollama and `gemma3:4b` are
available. The physical Realtek microphone was previously confirmed working by
Gerardo; the new automatic transcription path still needs an operator retry.

“Hide slopes” becoming “tight sloans” is a speech-recognition error upstream of
Gemma. The recognizer now uses the larger multilingual Small checkpoint rather
than Base. It retains automatic English/Spanish recognition and local CPU Q8
inference; no homophone substitution turns incorrect text into an action.
Small uses more memory and may take longer than Base. Synthetic tests do not
establish accuracy for the user's microphone, accent or room noise.

After updating from Base, run `npm run ai:speech:setup` once. After an adapter
code change, stop `ai:serve` with Ctrl+C, run `npm run ai:serve` again and reload
the page. The running Node adapter does not automatically reload server modules.

Small verification (2026-11-15): six synthetic fixtures passed actual local
Whisper inference and the layer-command parser. These include “hide slopes”
and “show slopes” at two speech rates, an English map command and a Spanish
map command. Warm requests took approximately 2.8–3.0 seconds; the first
included model loading and took 5.6 seconds. These are fixture measurements,
not a latency guarantee or proof of physical microphone accuracy. The voice
session regression test checks that unsupported input is neither spoken back
nor included in subtitle events.

## Verification and interface contract

The automatic bilingual change preserves the navy/yellow palette, fonts, map,
compact rail feedback, shared voice, alert priority and subtitles. The Input
EN/ES control and its saved preference are no longer used. No new raster assets
or visual tokens are introduced.

Unit tests cover WAV validation/resampling, silence, end-of-phrase capture,
manual finish, cancellation, late permissions, transcription cancellation,
English output and shared voice identity. `npm run ai:check` exercises 40 bilingual
adapter cases with Gemma and command guards. Browser integration uses explicitly labelled synthesized
microphone fixtures with real MediaRecorder, Whisper, Gemma and shared layers;
these do not establish physical microphone transcription or audible playback.

Final verification (2026-11-15): **40/40** bilingual adapter cases passed with
the configured Gemma model and command guards; **73** unit tests, ESLint and
both production builds passed. Dependency audit: zero vulnerabilities. Real
local HTTP tests transcribed both sample languages and returned the correct
slopes command; a resource-limited mission fixture retained its verified oxygen
deficit in the English explanation. Observed speech transcription took about
1.6–3.5 seconds; the loaded CPU adapter varied with concurrent requests, up to
18.2 seconds for a classification/explanation case. These are demo observations,
not latency guarantees or independent model benchmarks.

Fresh independent finish review: **ship**, scoped to this automatic bilingual
extension. Seven captures cover the production page, blocked-permission recovery,
desktop/tablet/mobile listening and a completed English layer command. The
reviewer checked the final 40-case log and found no open material issues.
DESIGN.md and its tokens remain unchanged; this uses the incumbent Operate
interface rather than introducing a new visual system.
