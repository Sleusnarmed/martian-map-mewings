// EVA and alerts share the installed female English voice, with a local fallback.
export function missionSpeechVoice(env, lang = 'en-US') {
  const voices = env.speechSynthesis?.getVoices() ?? []
  return voices.find(voice => voice.localService && voice.lang === lang && /\bZira\b/i.test(voice.name))
    || voices.find(voice => voice.localService && voice.lang === lang)
    || voices.find(voice => voice.localService && voice.lang.startsWith(lang.split('-')[0]))
    || voices.find(voice => voice.lang === lang)
    || voices.find(voice => voice.default)
    || voices[0]
    || null
}
