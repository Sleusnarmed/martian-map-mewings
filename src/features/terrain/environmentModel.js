export const LAST_MINUTE = 1435
export const SAMPLE_TOLERANCE_MINUTES = 35

export function clockLabel(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`
}

// Never combine sols, extrapolate through gaps, or silently substitute a zero.
export function observationAt(series, sol, minute) {
  if (!series || series.sol !== sol) return null
  let nearest = null
  let difference = Infinity
  for (const reading of series.readings) {
    const [h, m, s] = reading.time.split(':').map(Number)
    const offset = Math.abs(h * 60 + m + s / 60 - minute)
    if (Number.isFinite(reading.value) && offset < difference) {
      nearest = reading
      difference = offset
    }
  }
  return difference <= SAMPLE_TOLERANCE_MINUTES ? { ...nearest, offsetMinutes: difference } : null
}

// Illustrative palette only; this is not a measured atmospheric or illumination model.
export function skyColor(minute) {
  const daylight = Math.max(0, Math.sin((minute / 60 - 6) / 12 * Math.PI))
  const night = [13, 18, 29], day = [184, 143, 113]
  return night.map((value, i) => Math.round(value + (day[i] - value) * daylight))
}
