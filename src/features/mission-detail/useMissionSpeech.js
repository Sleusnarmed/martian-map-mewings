import { useEffect, useState, useSyncExternalStore } from 'react'
import { createMissionAudio } from './missionAudio.js'

export default function useMissionSpeech(text, lang = 'en-US', noticeId = '') {
  const [audio] = useState(() => createMissionAudio(window))
  const state = useSyncExternalStore(audio.subscribe, audio.getSnapshot, audio.getSnapshot)
  useEffect(() => {
    audio.present({ id: noticeId, text, lang })
    return audio.dispose
  }, [audio, text, lang, noticeId])
  return { ...state, toggle: audio.toggle }
}
