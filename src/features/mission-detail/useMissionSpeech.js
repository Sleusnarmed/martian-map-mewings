import { useCallback, useEffect, useRef, useState } from 'react'

export default function useMissionSpeech(text, lang = 'en-US') {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const utteranceRef = useRef(null)
  const [status, setStatus] = useState('idle')

  const cancelOwnedSpeech = useCallback(() => {
    const utterance = utteranceRef.current
    if (utterance) {
      // Clear handlers first: a late cancel/end event must not overwrite newer speech.
      utterance.onstart = null
      utterance.onend = null
      utterance.onerror = null
      utteranceRef.current = null
      window.speechSynthesis.cancel()
    }
  }, [])

  const stop = useCallback(() => {
    cancelOwnedSpeech()
    setStatus('idle')
  }, [cancelOwnedSpeech])

  useEffect(() => {
    // Cleanup also runs before a changed message is used: never finish an outdated alert.
    return cancelOwnedSpeech
  }, [text, lang, cancelOwnedSpeech])

  function speak() {
    if (!supported || !text?.trim()) return
    cancelOwnedSpeech()
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang === lang)
    if (voice) utterance.voice = voice
    utterance.onstart = () => setStatus('speaking')
    utterance.onend = () => { utteranceRef.current = null; setStatus('idle') }
    utterance.onerror = (event) => {
      utteranceRef.current = null
      setStatus(event.error === 'canceled' || event.error === 'interrupted' ? 'idle' : 'error')
    }
    utteranceRef.current = utterance
    setStatus('queued')
    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      cancelOwnedSpeech()
      setStatus('error')
    }
  }

  return { supported, status, speak, stop }
}
