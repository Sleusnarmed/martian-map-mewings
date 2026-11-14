"""Convert the published Jezero CTX DEM to a bounded geographic height grid.

Requires numpy and Pillow. Supports only the embedded spherical equirectangular CRS. No invented heights or missing-cell filling.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('dem', type=Path)
parser.add_argument('--output', type=Path, default=Path('public/terrain/jezero'))
parser.add_argument('--size', type=int, default=1025)
# This is a display crop around the crater, not a claimed geologic boundary.
parser.add_argument('--bounds', nargs=4, type=float, default=[77.15, 18.05, 77.85, 18.75], metavar=('WEST','SOUTH','EAST','NORTH'))
args = parser.parse_args()
if not 65 <= args.size <= 2048:
    parser.error('--size must be between 65 and 2048')
west, south, east, north = args.bounds
if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
    parser.error('Invalid geographic bounds')
with Image.open(args.dem) as src:
    tags = src.tag_v2
    directory = tags.get(34735, ())
    keys = {}
    for i in range(4, len(directory), 4):
        key, location, count, offset = directory[i:i+4]
        keys[key] = offset if location == 0 else tags[location][offset:offset+count]
        if isinstance(keys[key], tuple) and len(keys[key]) == 1:
            keys[key] = keys[key][0]
    if keys.get(3075) != 17 or keys.get(1025) != 1 or keys.get(3076) != 9001 or keys.get(2054) != 9102:
        raise SystemExit('Expected pixel-area, metre-unit spherical equirectangular GeoTIFF with degree angles.')
    radius = float(keys.get(2057, 0))
    if not 3390000 < radius < 3400000 or keys.get(2058) != radius:
        raise SystemExit('Expected spherical Mars mapping datum.')
    lat_ts = float(keys[3078])
    lon0, lat0 = float(keys[3088]), float(keys[3089])
    false_e, false_n = float(keys[3082]), float(keys[3083])
    if 34264 in tags:
        raise SystemExit('Rotated/transformed rasters are unsupported.')
    scale, tie = tags[33550], tags[33922]
    if len(tie) != 6 or scale[0] <= 0 or scale[1] <= 0:
        raise SystemExit('Unexpected raster georeferencing.')
    size = args.size
    dx, dy = (east-west)/(size-1), (north-south)/(size-1)
    lon, lat = np.meshgrid(np.linspace(west,east,size), np.linspace(north,south,size))
    x = radius * np.deg2rad(lon-lon0) * np.cos(np.deg2rad(lat_ts)) + false_e
    y = radius * np.deg2rad(lat-lat0) + false_n
    col = (x-tie[3])/scale[0] + tie[0] - 0.5
    row = (tie[4]-y)/scale[1] + tie[1] - 0.5
    c0, r0 = np.floor(col).astype(int), np.floor(row).astype(int)
    if c0.min()<0 or r0.min()<0 or c0.max()+1>=src.width or r0.max()+1>=src.height:
        raise SystemExit('Requested crop exceeds raster coverage.')
    raw = np.asarray(src, dtype=np.float32)
    nodata = float(tags.get(42113, 'nan'))
    values = [raw[r0,c0],raw[r0,c0+1],raw[r0+1,c0],raw[r0+1,c0+1]]
    if any(np.any(~np.isfinite(v) | (v == nodata) | (v < -15000)) for v in values):
        raise SystemExit('Crop includes missing cells. Choose a fully covered crop.')
    fx, fy = col-c0, row-r0
    grid = ((values[0]*(1-fx)+values[1]*fx)*(1-fy)+(values[2]*(1-fx)+values[3]*fx)*fy).astype(np.float32)
    if not np.isfinite(grid).all():
        raise SystemExit('Crop includes missing DEM cells. Choose a fully covered crop; missing cells will not be filled.')
    if grid.min() < -15000 or grid.max() > 30000:
        raise SystemExit('Unexpected elevation range; inspect source no-data values and units.')
    metadata = {
        'version': 1, 'width': size, 'height': size, 'bounds': args.bounds,
        'radius': radius, 'heightFile': 'heights.f32', 'encoding': 'float32-little-endian',
        'minimumHeight': float(grid.min()), 'maximumHeight': float(grid.max()),
        'sourceResolutionMeters': 20,
        'displayResolutionMeters': round(max(np.deg2rad(dx)*radius*np.cos(np.deg2rad((south+north)/2)), np.deg2rad(dy)*radius)),
        'coordinateConvention': 'planetocentric latitude; east-positive longitude; degrees',
        'verticalReference': 'MOLA; source heights retained in metres',
        'source': 'https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic',
        'sourceFilename': args.dem.name,
        'sourceSha256': hashlib.sha256(args.dem.read_bytes()).hexdigest(),
        'sourceCrs': {'projection': 'spherical equirectangular', 'radius': radius, 'standardParallel': lat_ts, 'centralMeridian': lon0, 'latitudeOrigin': lat0, 'falseEasting': false_e, 'falseNorthing': false_n},
        'processing': 'Geographic crop; bilinear resampling; no gap filling; no vertical exaggeration',
    }
args.output.mkdir(parents=True, exist_ok=True)
grid.astype('<f4').tofile(args.output / 'heights.f32')
(args.output / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(f'Prepared {size} × {size} samples in {args.output}; elevation {grid.min():.1f} to {grid.max():.1f} m')
