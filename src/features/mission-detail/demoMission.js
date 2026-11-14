const nasaSource = 'https://science.nasa.gov/resource/sample-collection-and-rock-analysis-at-wildcat-ridge/'

export const regions = {
  'syrtis-major': {
    id: 'syrtis-major', name: 'Syrtis Major', eyebrow: 'Regional context',
    description: 'Regional overview for the Jezero excursion. The local demonstration focuses on Jezero and the Wildcat Ridge science stop.',
    objective: 'Locate the mission region before reviewing the local science destination.',
    geology: 'Regional layers pending integration.',
    source: 'https://trek.nasa.gov/mars/',
  },
  jezero: {
    id: 'jezero', name: 'Jezero crater', eyebrow: 'Mission region',
    description: 'An ancient lake basin with a preserved river delta. This local mission follows a simulated route to a scientific stop within Jezero.',
    objective: 'Explore the relationship between the delta landscape and the rocks observed at Wildcat Ridge.',
    geology: 'Ancient lake and river-delta setting.',
    source: nasaSource,
  },
  'wildcat-ridge': {
    id: 'wildcat-ridge', name: 'Wildcat Ridge', eyebrow: 'Science destination',
    description: 'A rocky outcrop in Jezero’s delta where Perseverance collected two rock cores and examined an abraded surface.',
    objective: 'Recognize the outcrop and inspect the published evidence of sampling and rock analysis.',
    geology: 'Rock outcrop within the Jezero delta.',
    source: nasaSource,
  },
}

export const wildcatImage = {
  src: 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/7/47560_PIA24928.jpg?fit=clip&w=1400',
  alt: 'Perseverance mosaic of the rocky Wildcat Ridge outcrop, including sampling and abrasion sites.',
  credit: 'NASA/JPL-Caltech/ASU/MSSS',
  instrument: 'Perseverance · Mastcam-Z',
  date: '4 Aug 2022 · Sol 518',
  note: 'Contrast-enhanced mosaic. Historical observation at Wildcat Ridge, not a live view or a route map.',
  source: nasaSource,
}

// Fixtures only. José’s route module will supply these values during integration.
// Oxygen is represented as an assumed remaining duration, not pressure or a sensor reading.
export const demoScenarios = [
  {
    id: 'normal', label: 'Normal traverse', shortLabel: '01 / Traverse',
    description: 'A normal traverse with time and oxygen autonomy above the exercise reserve.',
    mode: 'outbound', status: 'in-progress', nextWaypointName: 'Delta lookout', routeProgress: 0.23,
    remainingDistanceMeters: 420, returnDistanceMeters: 600, returnDurationSeconds: 1200,
    elapsedSeconds: 1200, delaySeconds: 0, budgetSeconds: 3600,
    returnMarginSeconds: 1200, oxygenRemainingSeconds: 2400, oxygenReturnMarginSeconds: 1200,
    reserveSeconds: 300,
    notice: { id: 'normal-notice', level: 'info', title: 'Continue to the next waypoint',
      text: 'Continue to Delta lookout. Time and assumed oxygen return margins are twenty minutes. The exercise requires a five-minute reserve.', provenance: 'simulation' },
  },
  {
    id: 'delay', label: 'Low return margin', shortLabel: '02 / Delay',
    description: 'Observation time and an eight-minute delay leave only two minutes of return margin.',
    mode: 'outbound', status: 'in-progress', nextWaypointName: 'Wildcat Ridge', routeProgress: 0.8,
    remainingDistanceMeters: 120, returnDistanceMeters: 600, returnDurationSeconds: 1200,
    elapsedSeconds: 2280, delaySeconds: 480, budgetSeconds: 3600,
    returnMarginSeconds: 120, oxygenRemainingSeconds: 1320, oxygenReturnMarginSeconds: 120,
    reserveSeconds: 300,
    notice: { id: 'delay-notice', level: 'warning', title: 'Review your return',
      text: 'After an eight-minute delay, time and assumed oxygen return margins are two minutes. The exercise requires five. Review your return route.', provenance: 'simulation' },
  },
  {
    id: 'arrival', label: 'Science stop reached', shortLabel: '03 / Arrival',
    description: 'At the destination, open the surface evidence before beginning the return.',
    mode: 'outbound', status: 'arrived', nextWaypointName: 'Wildcat Ridge', routeProgress: 1,
    remainingDistanceMeters: 0, returnDistanceMeters: 600, returnDurationSeconds: 1200,
    elapsedSeconds: 1200, delaySeconds: 0, budgetSeconds: 3600,
    returnMarginSeconds: 1200, oxygenRemainingSeconds: 2100, oxygenReturnMarginSeconds: 900,
    reserveSeconds: 300,
    notice: { id: 'arrival-notice', level: 'info', title: 'Wildcat Ridge reached',
      text: 'You have reached Wildcat Ridge in the simulation. Review the Mastcam-Z image and its source. Your assumed oxygen return margin is fifteen minutes.', provenance: 'simulation' },
  },
  {
    id: 'seismic-delay', label: 'Delay + seismic alert', shortLabel: '04 / Hazard',
    description: 'A fictional seismic alert and an eight-minute delay exercise the return decision. This is not a hazard forecast for Jezero.',
    mode: 'outbound', status: 'in-progress', nextWaypointName: 'Wildcat Ridge', routeProgress: 0.8,
    remainingDistanceMeters: 120, returnDistanceMeters: 600, returnDurationSeconds: 1200,
    elapsedSeconds: 2280, delaySeconds: 480, budgetSeconds: 3600,
    returnMarginSeconds: 120, oxygenRemainingSeconds: 1260, oxygenReturnMarginSeconds: 60,
    reserveSeconds: 300,
    notice: { id: 'seismic-notice', level: 'warning', title: 'Simulated seismic alert',
      text: 'Exercise only. A simulated seismic alert affects this segment. After the delay, your time return margin is two minutes and your assumed oxygen return margin is one minute. Review the return route.', provenance: 'simulation' },
  },
]

export const missingMission = {
  id: 'missing', mode: 'outbound', status: 'in-progress', nextWaypointName: null, routeProgress: null,
  remainingDistanceMeters: null, returnDurationSeconds: null, returnMarginSeconds: null,
  oxygenRemainingSeconds: null, oxygenReturnMarginSeconds: null, reserveSeconds: null,
  notice: { id: 'missing-notice', level: 'unknown', title: 'Mission data unavailable',
    text: 'Route and oxygen estimates are unavailable. Review the missing data before making an exercise decision.', provenance: 'simulation' },
}
