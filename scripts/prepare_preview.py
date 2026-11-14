"""Build a lightweight shaded-relief preview from the prepared real DEM."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
folder = root / 'public/terrain/jezero'
metadata = json.loads((folder / 'metadata.json').read_text())
region = json.loads((root / 'src/features/terrain/region.json').read_text())
if metadata['bounds'] != region['bounds']:
    raise SystemExit('Preview bounds and region configuration do not match.')
heights = np.fromfile(folder / 'heights.f32', dtype='<f4').reshape(metadata['height'],metadata['width'])
# Preserve geographic proportions at the middle latitude (north is up).
west, south, east, north = metadata['bounds']
width = 768
height = round(width * (north-south) / ((east-west)*np.cos(np.deg2rad((north+south)/2))))
grid = np.asarray(Image.fromarray(heights).resize((width,height),Image.Resampling.BILINEAR))
dx = metadata['radius']*np.deg2rad(east-west)*np.cos(np.deg2rad((north+south)/2))/(width-1)
dy = metadata['radius']*np.deg2rad(north-south)/(height-1)
gy,gx = np.gradient(grid,dy,dx)
# Northwest illumination; visual shading is derived, not an observation of lighting.
norm = np.sqrt(gx*gx+gy*gy+1)
light = np.clip((-gx*-.5-gy*-.5+0.70710678)/norm,0,1)
shade = .58+.55*light
colors = np.array([[int(c[i:i+2],16) for i in (1,3,5)] for c in region['palette']])
t = np.clip((grid-metadata['minimumHeight'])/(metadata['maximumHeight']-metadata['minimumHeight']),0,1)*4
lo = np.minimum(t.astype(int),3)
f = (t-lo)[...,None]
rgb = np.clip((colors[lo]*(1-f)+colors[lo+1]*f)*shade[...,None],0,255).astype('uint8')
Image.fromarray(rgb).save(folder/'preview.webp',quality=83,method=6)
print(f'Preview: {width}×{height}, {(folder/"preview.webp").stat().st_size:,} bytes')
