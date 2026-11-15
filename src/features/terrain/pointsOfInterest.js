// Hazeltop sample position represents the Wildcat Ridge outcrop, not its boundary.
// NASA PDS, Initial Reports Volume 2 Release 2, Hazeltop, page 14-1.
export const JEZERO_POINTS = [
  {
    id: 'wildcat-ridge',
    name: 'Wildcat Ridge · Hazeltop',
    latitude: 18.45863707,
    longitude: 77.40588851,
    source: 'https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=58',
    contextSource: 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/',
    reference: 'M2020-509-14 Hazeltop, page 14-1, September 21, 2022',
    positionNote: 'Published Hazeltop sample position; represents Wildcat Ridge, not its boundary.',
  },
  {
    id: 'skinner-ridge',
    name: 'Skinner Ridge · Swift Run',
    latitude: 18.458931,
    longitude: 77.40617078,
    displayModes: ['walk'],
    source: 'https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=14',
    contextSource: 'https://science.nasa.gov/photojournal/2-perseverance-sampling-locations-in-jezeros-delta/',
    reference: 'M2020-490-11 Swift Run, pages 11-1–11-2',
    summary: 'Perseverance sampled sandstone at this western Jezero delta outcrop on July 6, 2022.',
    positionNote: 'Published Swift Run sample position; represents the outcrop, not its boundary.',
  },
  {
    id: 'amalik',
    name: 'Amalik · Shuyak',
    latitude: 18.45068954,
    longitude: 77.40143171,
    displayModes: ['walk'],
    source: 'https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=100',
    contextSource: 'https://science.nasa.gov/resource/meet-the-mars-samples-shuyak-and-mageik-samples-14-and-15/',
    reference: 'M2020-575-16 Shuyak, pages 16-1–16-2',
    summary: 'Perseverance collected Shuyak from this fine-grained sedimentary outcrop on October 2, 2022.',
    positionNote: 'Published Shuyak sample position; represents the outcrop, not its boundary.',
  },
]
