// The application and EVA share one voice identity. Preserve the alert voice.
export function missionSpeechVoice(env, lang = 'en-US') {
  const voices = env.speechSynthesis?.getVoices() ?? []
  return voices.find(voice => voice.localService && voice.lang === lang)
    || voices.find(voice => voice.localService && voice.lang.startsWith(lang.split('-')[0]))
    || voices.find(voice => voice.lang === lang)
    || voices.find(voice => voice.default)
    || voices[0]
    || null
}
