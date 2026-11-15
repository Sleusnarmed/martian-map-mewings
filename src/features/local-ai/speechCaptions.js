export const CAPTION_EVENT = 'mission-speech-caption'
export function publishCaption(env, source, text) {
  if (env.CustomEvent && env.dispatchEvent) env.dispatchEvent(new env.CustomEvent(CAPTION_EVENT, { detail: { source, text } }))
}
