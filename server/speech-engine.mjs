import { resolve } from 'node:path'
import { env, pipeline, LogitsProcessor, LogitsProcessorList, StoppingCriteria, StoppingCriteriaList } from '@huggingface/transformers'
import { decodeSpeechWav } from '../src/features/local-ai/audioWav.js'

export const SPEECH_MODEL = 'onnx-community/whisper-small'
export const SPEECH_REVISION = '36050c46d777d46dc4b5f43f6d90574fc38f8732'
env.cacheDir = resolve('.cache/eva-speech')
let modelPromise
let ready = false
export const speechStatus = () => ({ ready, automaticLanguages: ['en', 'es'] })

export async function warmSpeechModel({ download = false } = {}) {
  modelPromise ??= pipeline('automatic-speech-recognition', SPEECH_MODEL, { revision: SPEECH_REVISION, dtype: 'q8', device: 'cpu', local_files_only: !download,
    session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } }).then(model => { ready = true; return model }).catch(error => { modelPromise = null; throw error })
  return modelPromise
}

class StopOnAbort extends StoppingCriteria {
  constructor(signal) { super(); this.signal = signal }
  _call(ids) { return ids.map(() => this.signal?.aborted ?? false) }
}

export async function transcribeSpeech(bytes, { signal } = {}) {
  const samples = decodeSpeechWav(bytes)
  signal?.throwIfAborted()
  const recognizer = await warmSpeechModel()
  signal?.throwIfAborted()
  const features = await recognizer.processor(samples)
  const config = recognizer.model.generation_config
  const english = config.lang_to_id['<|en|>'], spanish = config.lang_to_id['<|es|>']
  if (!Number.isInteger(english) || !Number.isInteger(spanish)) throw new Error('SPEECH_MODEL_INVALID')
  let language
  // Transformers.js defaults to English when language is omitted. Explicitly
  // inspect Whisper's language-token probabilities instead of pretending that
  // an unset browser/model language enables automatic bilingual recognition.
  class PickLanguage extends LogitsProcessor {
    _call(_ids, scores) {
      language = scores.data[spanish] > scores.data[english] ? 'es' : 'en'
      scores.data.fill(-Infinity)
      scores.data[language === 'es' ? spanish : english] = 0
      return scores
    }
  }
  const logits = new LogitsProcessorList(); logits.push(new PickLanguage())
  const stopping = new StoppingCriteriaList(); stopping.push(new StopOnAbort(signal))
  await recognizer.model.generate({ ...features, decoder_input_ids: [[config.decoder_start_token_id]], max_new_tokens: 1, logits_processor: logits, suppress_tokens: [], begin_suppress_tokens: [], stopping_criteria: stopping })
  signal?.throwIfAborted()
  const output = await recognizer.model.generate({ ...features, language, task: 'transcribe', max_new_tokens: 96, stopping_criteria: stopping })
  signal?.throwIfAborted()
  const text = recognizer.tokenizer.batch_decode(output, { skip_special_tokens: true })[0]?.trim()
  if (!text || text.length > 1000 || !/[a-záéíóúñ]/i.test(text)) throw new Error('NO_SPEECH')
  return { text, language }
}
