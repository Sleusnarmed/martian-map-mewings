import { Cartesian3, Matrix3, Math as CesiumMath } from 'cesium'
import { BRIGHT_STARS } from './brightStars.js'

const LMST_SECOND_MS = 1000 * 1.0274912517
const J2000_UTC_MS = Date.UTC(2000, 0, 1, 12)
const DAY_MS = 86_400_000

// PDS label start_date_time and the first matching CSV SCLK/LMST record.
// Both anchors use the rover's published mission clock for the respective sol.
export const MISSION_TIME_ANCHORS = {
  312: {
    utc: '2022-01-04T18:15:32.142Z',
    lmstSeconds: 0.201,
    source: 'https://pds-atmospheres.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_derived_env/sol_0300_0419/sol_0312/WE__0312___________DER_WS__________________P02.xml',
  },
  518: {
    utc: '2022-08-04T10:10:35.302Z',
    lmstSeconds: 3.019,
    source: 'https://pds-atmospheres.nmsu.edu/PDS/data/PDS4/Mars2020/mars2020_meda/data_calibrated_env/sol_0420_0539/sol_0518/WE__0518___________CAL_ATS_________________P01.xml',
  },
}

export function missionSkyInstant(sol, minute) {
  if (!Number.isInteger(sol) || !Number.isFinite(minute) || minute < 0 || minute >= 1440) return null
  const anchor = MISSION_TIME_ANCHORS[sol]
  if (!anchor) return null
  return Date.parse(anchor.utc) + (minute * 60 - anchor.lmstSeconds) * LMST_SECOND_MS
}

// Non-zero BODY499 terms from NAIF pck00011.tpc. Phase rates are degrees per
// Julian century. Mars pole phases and prime-meridian phases use separate terms.
const poleRaTerms = [
  [198.991226, 19139.4819985, 0.000068],
  [226.292679, 38280.8511281, 0.000238],
  [249.663391, 57420.7251593, 0.000052],
  [266.183510, 76560.6367950, 0.000009],
  [79.398797, 0.5042615, 0.419057],
]
const poleDecTerms = [
  [122.433576, 19139.9407476, 0.000051],
  [43.058401, 38280.8753272, 0.000141],
  [57.663379, 57420.7517205, 0.000031],
  [79.476401, 76560.6495004, 0.000005],
  [166.325722, 0.5042615, 1.591274],
]
const meridianTerms = [
  [129.071773, 19140.0328244, 0.000145],
  [36.352167, 38281.0473591, 0.000157],
  [56.668646, 57420.9295360, 0.000040],
  [67.364003, 76560.2552215, 0.000001],
  [104.792680, 95700.4387578, 0.000001],
  [95.391654, 0.5042615, 0.584542],
]

function periodicSum(terms, centuries, trig) {
  return terms.reduce((sum, [phase, rate, amplitude]) =>
    sum + amplitude * trig(CesiumMath.toRadians(phase + rate * centuries)), 0)
}

export function inertialToMarsFixed(utcMs) {
  // Supported mission instants are in 2022, with TT−UTC = 69.184 s.
  // TT approximates TDB at this display scale (difference under 2 ms).
  const days = (utcMs - J2000_UTC_MS + 69_184) / DAY_MS
  const centuries = days / 36_525
  const a = CesiumMath.toRadians(317.269202 - 0.10927547 * centuries + periodicSum(poleRaTerms, centuries, Math.sin))
  const d = CesiumMath.toRadians(54.432516 - 0.05827105 * centuries + periodicSum(poleDecTerms, centuries, Math.cos))
  const w = CesiumMath.toRadians((176.049863 + 350.891982443297 * days + periodicSum(meridianTerms, centuries, Math.sin)) % 360)
  const node = Matrix3.fromRotationZ(-(Math.PI / 2 + a))
  const pole = Matrix3.fromRotationX(-(Math.PI / 2 - d))
  const meridian = Matrix3.fromRotationZ(-w)
  return Matrix3.multiply(meridian, Matrix3.multiply(pole, node, new Matrix3()), new Matrix3())
}

export function inertialStarDirection(rightAscension, declination) {
  const ra = CesiumMath.toRadians(rightAscension)
  const dec = CesiumMath.toRadians(declination)
  return new Cartesian3(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec))
}

export function localSkyFrame(longitude, latitude) {
  const lon = CesiumMath.toRadians(longitude)
  const lat = CesiumMath.toRadians(latitude)
  return {
    east: new Cartesian3(-Math.sin(lon), Math.cos(lon), 0),
    north: new Cartesian3(-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)),
    up: new Cartesian3(Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)),
  }
}

export function horizontalSkyDirection(direction, frame) {
  const east = Cartesian3.dot(direction, frame.east)
  const north = Cartesian3.dot(direction, frame.north)
  const up = Cartesian3.dot(direction, frame.up)
  return {
    azimuth: CesiumMath.zeroToTwoPi(Math.atan2(east, north)),
    altitude: Math.atan2(up, Math.hypot(east, north)),
  }
}

const stars = BRIGHT_STARS.map(([id, ra, dec, magnitude]) => ({
  id,
  magnitude,
  inertial: inertialStarDirection(ra, dec),
}))

export function buildMarsSky(sol, minute) {
  const utcMs = missionSkyInstant(sol, minute)
  if (utcMs === null) return null
  const rotation = inertialToMarsFixed(utcMs)
  return {
    utcMs,
    stars: stars.map(({ id, magnitude, inertial }) => ({
      id,
      magnitude,
      direction: Matrix3.multiplyByVector(rotation, inertial, new Cartesian3()),
    })),
  }
}
