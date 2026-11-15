// NASA PDS Sample Dossier, Volumes 3 and 4. Report identifiers include witness
// tubes, so their numbering differs from the public rock-sample catalogue.
const archive = 'https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/'
const contextSource = 'https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/'

export const EXPANDED_JEZERO_POINTS = [
  { id: 'berea', name: 'Berea · Melyn', latitude: 18.47021736, longitude: 77.38394465,
    volume: 3, page: 14, report: 'M2020-749-22 Melyn', campaign: 'Upper fan · Tenby',
    summary: 'A layered sandstone outcrop sampled on the upper fan. The sample provides evidence of sediment transport and later mineral alteration.' },
  { id: 'emerald-lake', name: 'Emerald Lake · Otis Peak', latitude: 18.4829798, longitude: 77.36815348,
    volume: 3, page: 48, report: 'M2020-822-23 Otis Peak', campaign: 'Upper fan · Powell Peak',
    summary: 'A coarse sedimentary sampling site on the upper fan, used to investigate the material carried by ancient flowing water.' },
  { id: 'dream-lake', name: 'Dream Lake · Pilot Mountain', latitude: 18.48380149, longitude: 77.3604692,
    volume: 3, page: 86, report: 'M2020-882-24 Pilot Mountain', campaign: 'Upper fan',
    summary: 'A sandstone sampling site on the upper fan. Its grains, carbonate matrix and silica-rich material record deposition and alteration.' },
  { id: 'hans-amundsen', name: 'Hans Amundsen Memorial · Pelican Point', latitude: 18.48344692, longitude: 77.35065098,
    volume: 4, page: 14, report: 'M2020-923-25 Pelican Point', campaign: 'Margin · Mandu Wall',
    summary: 'A western-margin workspace sampled to study altered material at the edge of the ancient Jezero basin. Its depositional origin remains under investigation.' },
  { id: 'turquoise-bay', name: 'Turquoise Bay · Lefroy Bay', latitude: 18.48867278, longitude: 77.34704595,
    volume: 4, page: 49, report: 'M2020-949-26 Lefroy Bay', campaign: 'Margin unit',
    summary: 'A margin-unit sampling site containing altered, coarse-grained material. The report discusses several possible geological origins.' },
  { id: 'bunsen-peak', name: 'Bunsen Peak · Comet Geyser', latitude: 18.49186664, longitude: 77.3272192,
    volume: 4, page: 87, report: 'M2020-1088-27 Comet Geyser', campaign: 'Western margin',
    summary: 'A carbonate- and silica-rich sampling site on the western margin, investigated for its record of water–rock interaction.' },
  { id: 'cheyava-falls', name: 'Cheyava Falls · Sapphire Canyon', latitude: 18.49747434, longitude: 77.30514915,
    volume: 4, page: 120, report: 'M2020-1215-28 Sapphire Canyon', campaign: 'Neretva Vallis · Bright Angel',
    summary: 'A fine-grained rock with calcium-sulfate veins in the Bright Angel area. Its textures and mineral associations record past alteration.' },
].map(({ volume, page, report, ...point }) => ({ ...point, markerHeight: 2,
  source: `${archive}initial_reports_volume${volume}.pdf#page=${page}`, contextSource,
  reference: `NASA PDS · Initial Reports Volume ${volume} · ${report} · PDF page ${page}`,
  positionNote: 'Published sample-acquisition position; represents the named site, not its boundary. Preliminary report measurements may be revised.',
}))
