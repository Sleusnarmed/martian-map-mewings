// Owns only the current tile window. No decoded images remain outside it.
export function createNearbyTileCache({ load, release, onChange, concurrency = 2 }) {
  const loaded = new Map(), pending = new Map(), failed = new Set()
  let active = new Map(), disposed = false
  const report = () => onChange({ loaded: loaded.size, pending: pending.size, visible: active.size,
    status: !active.size ? 'off' : [...active.keys()].some(key => failed.has(key)) ? 'error'
      : [...active.keys()].every(key => loaded.has(key)) ? 'ready' : 'loading' })
  function pump() {
    if (disposed) return
    for (const tile of active.values()) {
      if (pending.size >= concurrency) break
      if (loaded.has(tile.key) || pending.has(tile.key) || failed.has(tile.key)) continue
      const controller = new AbortController()
      pending.set(tile.key, controller)
      Promise.resolve().then(() => load(tile, controller.signal)).then(value => {
        if (disposed || controller.signal.aborted || !active.has(tile.key)) release(value)
        else loaded.set(tile.key, value)
      }).catch(error => {
        if (!disposed && !controller.signal.aborted && active.has(tile.key) && error?.name !== 'AbortError') failed.add(tile.key)
      }).finally(() => {
        pending.delete(tile.key)
        if (!disposed) { report(); pump() }
      })
    }
    report()
  }
  return {
    update(tiles) {
      if (disposed) return
      active = new Map(tiles.map(tile => [tile.key, tile]))
      for (const [key, value] of loaded) if (!active.has(key)) { release(value); loaded.delete(key) }
      for (const [key, controller] of pending) if (!active.has(key)) controller.abort()
      for (const key of failed) if (!active.has(key)) failed.delete(key)
      pump()
    },
    dispose() {
      disposed = true
      pending.forEach(controller => controller.abort())
      loaded.forEach(release); loaded.clear(); active.clear(); failed.clear()
    },
  }
}
