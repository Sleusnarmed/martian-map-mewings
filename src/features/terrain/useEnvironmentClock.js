import { useEffect, useState } from 'react'
import { wildcatAsset } from './wildcatImagery'
import { LAST_MINUTE, observationAt } from './environmentModel'

export function useEnvironmentClock(enabled) {
  const [archive, setArchive] = useState({ status: 'loading' })
  const [clock, setClock] = useState({ sol: 518, minute: 735, playing: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch(wildcatAsset('meda.json'), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('MEDA unavailable')
        return response.json()
      })
      .then(data => { if (!controller.signal.aborted) setArchive({ status: 'ready', data }) })
      .catch(() => { if (!controller.signal.aborted) setArchive({ status: 'error' }) })
    return () => controller.abort()
  }, [enabled, attempt])
  useEffect(() => {
    if (!enabled || !clock.playing || archive.status !== 'ready') return
    const timer = setInterval(() => {
      // Pause in background tabs: returning must not jump over observations.
      if (document.hidden) return
      setClock(previous => {
        const minute = Math.min(LAST_MINUTE, previous.minute + 5)
        return { ...previous, minute, playing: minute < LAST_MINUTE }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [enabled, clock.playing, archive.status])
  return {
    ...clock, archive,
    reading: id => observationAt(archive.data?.[id], clock.sol, clock.minute),
    seek: minute => setClock(previous => ({ ...previous, minute, playing: false })),
    chooseSol: sol => setClock(previous => ({ ...previous, sol, playing: false })),
    toggle: () => setClock(previous => ({ ...previous,
      minute: previous.minute >= LAST_MINUTE ? 0 : previous.minute,
      playing: !previous.playing,
    })),
    retry: () => { setArchive({ status: 'loading' }); setAttempt(value => value + 1) },
  }
}
