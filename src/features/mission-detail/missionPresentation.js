export const isAvailable = (value) => typeof value === 'number' && Number.isFinite(value)
export const formatMinutes = (value) => isAvailable(value) ? `${Number((value / 60).toFixed(1))} min` : 'No data'
export const formatMeters = (value) => isAvailable(value) && value >= 0 ? `${Math.round(value)} m` : 'No data'

export function getReturnState(mission) {
  const known = isAvailable(mission?.returnMarginSeconds) && isAvailable(mission?.oxygenReturnMarginSeconds) && isAvailable(mission?.reserveSeconds)
  const margin = known ? Math.min(mission.returnMarginSeconds, mission.oxygenReturnMarginSeconds) : null
  return { known, margin, belowReserve: known && margin < mission.reserveSeconds }
}
