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

export default function RouteGuide({ navigation }) {
  const { route, context, startRoute, aimAtWaypoint } = navigation
  const guidance = context?.guidance
  if (!route || !guidance) return null
  const degrees = guidance.arrived ? 0 : guidance.bearing * 180 / Math.PI - context.heading
  const offRoute = guidance.crossTrack > 30
  const status = guidance.arrived ? 'Arrived at Wildcat Ridge' : offRoute ? 'Return to the marked route' : guidance.next.name
  return <section className="route-guide" aria-label="Wildcat Ridge route guidance">
    <div className="route-guide-top"><span className="route-swatch" aria-hidden="true" /> <span>Wildcat Ridge · simulated route</span></div>
    <div className="route-next">
      <span className="route-arrow" aria-hidden="true" style={{ transform: `rotate(${degrees}deg)` }}>{guidance.arrived ? '✓' : '↑'}</span>
      <div><strong>{status}</strong>
        <p>{guidance.arrived
          ? `${Math.round(route.length)} m route complete`
          : offRoute ? `${Math.round(guidance.crossTrack)} m from route` : `${Math.round(guidance.distance)} m to waypoint · ${Math.round(guidance.remaining)} m left`}</p>
      </div>
    </div>
    <progress value={guidance.arrived ? route.length : guidance.progress} max={route.length} aria-label="Projected route progress" />
    <div className="route-guide-actions">
      <button type="button" onClick={aimAtWaypoint} disabled={guidance.arrived}>Face waypoint</button>
      <button type="button" onClick={startRoute}>Restart route</button>
    </div>
  </section>
}
