export function DriveButton({ explorer, action, label, children }) {
  return <button
    type="button"
    aria-label={label}
    title={label}
    className="terrain-drive-button"
    onPointerDown={event => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      explorer.step(action)
      explorer.hold(event.pointerId, action)
    }}
    onPointerUp={event => explorer.release(event.pointerId)}
    onPointerCancel={event => explorer.release(event.pointerId)}
    onLostPointerCapture={event => explorer.release(event.pointerId)}
    onClick={event => { if (event.detail === 0) explorer.step(action) }}
  >{children}</button>
}

