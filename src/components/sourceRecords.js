const records = [
  ['P9QJDP48', 'HiRISE orthomosaic', 'NASA / JPL / USGS', 'USGS data release · DOI 10.5066/P9QJDP48'],
  ['P9REJ9JN', 'HiRISE elevation model', 'NASA / JPL / USGS', 'USGS data release · DOI 10.5066/P9REJ9JN'],
  ['science_investigation_ctx_dem_mosaic', 'Jezero CTX elevation mosaic', 'NASA / JPL / USGS', 'Mars 2020 Science Investigation CTX DEM · MOLA vertical reference'],
  ['geologic-map-jezero', 'Geologic map of Jezero and Nili Planum', 'USGS', 'Sun & Stack (2020) · Scientific Investigations Map 3464'],
  ['Initial Reports', 'Mars 2020 Initial Reports', 'NASA Planetary Data System · Geosciences Node', 'Sample acquisition reports · see the sample identifier and printed page in this record.'],
  ['initial_reports', 'Mars 2020 Initial Reports', 'NASA Planetary Data System · Geosciences Node', 'Sample acquisition reports'],
  ['14300', 'Jezero crater nomenclature', 'IAU / USGS', 'Gazetteer of Planetary Nomenclature · Feature 14300 · center 18.41° N, 77.69° E'],
  ['PIA24928', 'Wildcat Ridge sampling mosaic', 'NASA / JPL-Caltech / ASU / MSSS', 'Photojournal PIA24928 · Mastcam-Z · Sol 518'],
  ['wildcat-ridge', 'Wildcat Ridge sampling and rock analysis', 'NASA / JPL-Caltech / ASU / MSSS', 'Photojournal PIA24928 · Mastcam-Z · Sol 518'],
  ['mars-rock-samples', 'Perseverance rock sample catalogue', 'NASA Science · Mars 2020', 'Sample names, parent outcrops and campaign context'],
  ['rochette-after', 'Rochette after sampling', 'NASA / JPL-Caltech', 'Montdenier and Montagnac boreholes · September 2021'],
  ['to-seitah-and-back', 'To Séítah and Back', 'NASA Science / JPL-Caltech · Vivian Sun', 'Crater-floor science campaign · Brac outcrop and South Séítah'],
  ['2-perseverance-sampling', 'Sampling locations in Jezero’s delta', 'NASA / JPL-Caltech', 'Skinner Ridge and Wildcat Ridge · Perseverance delta campaign'],
  ['shuyak-and-mageik', 'Shuyak and Mageik sample context', 'NASA Science · Mars 2020', 'Amalik outcrop · delta-front samples'],
  ['pds-atmospheres', 'Perseverance MEDA archive', 'NASA Planetary Data System · Atmospheres Node', 'Mars Environmental Dynamics Analyzer · historical observations'],
  ['I/239', 'Hipparcos star catalogue', 'ESA / CDS', 'Catalogue I/239 · bright-star reference positions'],
  ['trek.nasa.gov', 'Mars Trek cartographic context', 'NASA', 'Mars regional mapping and orbital imagery'],
]

// URLs remain provenance metadata. Rendering a reference never navigates away.
export function sourceRecord(source = '') {
  let decoded
  try { decoded = decodeURIComponent(source) } catch { decoded = source }
  const record = records.find(([match]) => decoded.includes(match))
  if (record) {
    const [, title, publisher, reference] = record
    const product = /\.(xml|png|pdf)(#.*)?$/i.test(decoded) ? decoded.split('/').at(-1).split('#')[0] : null
    return { title, publisher, reference, product }
  }
  return { title: 'Archived science reference', publisher: 'Mission source catalogue', reference: 'Source metadata retained in the mission package.' }
}
