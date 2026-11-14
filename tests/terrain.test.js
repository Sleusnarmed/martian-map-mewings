import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildHeightTile, createTerrainProvider, TILE_SIZE } from '../src/features/terrain/createTerrainProvider.js'
import { constrainCamera, MIN_CLEARANCE, MAX_PITCH } from '../src/features/terrain/cameraLimits.js'
import { sampleHeight } from '../src/features/terrain/terrainData.js'

const data = JSON.parse(fs.readFileSync(new URL('../public/terrain/jezero/metadata.json', import.meta.url)))
const bytes = fs.readFileSync(new URL('../public/terrain/jezero/heights.f32', import.meta.url))
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
data.heights = Float32Array.from({length: data.width * data.height}, (_, i) => view.getFloat32(i * 4, true))

test('finite terrain stops at the source resolution', async () => {
  const provider = createTerrainProvider(data)
  assert.equal(provider.maximumLevel, 4)
  assert.equal(provider.getLevelMaximumGeometricError(4), 0)
  assert.equal(provider.getTileDataAvailable(0,0,5), false)
  assert.equal(provider.getTileDataAvailable(16,0,4), false)
  const parent = await provider.requestTileGeometry(0,0,3)
  const leaf = await provider.requestTileGeometry(0,0,4)
  assert.equal(parent.childTileMask,15)
  assert.equal(leaf.childTileMask,0)
  assert.equal(provider.availability.isTileAvailable(4,15,15),true)
  assert.equal(provider.availability.isTileAvailable(5,0,0),false)
  await assert.rejects(provider.requestTileGeometry(0,0,5))
})

test('tile seams share exactly equal heights across every source level', () => {
  for(let level=1;level<=4;level++) {
    const a=buildHeightTile(data,0,0,level)
    const east=buildHeightTile(data,1,0,level)
    const south=buildHeightTile(data,0,1,level)
    for(let i=0;i<TILE_SIZE;i++) {
      assert.equal(a[i*TILE_SIZE+64],east[i*TILE_SIZE])
      assert.equal(a[64*TILE_SIZE+i],south[i])
    }
  }
})

test('finest tiles preserve real source samples and parent edges align', () => {
  const leaf=buildHeightTile(data,7,6,4)
  for(let y=0;y<65;y++) for(let x=0;x<65;x++) {
    assert.equal(leaf[y*65+x],data.heights[(6*64+y)*data.width+7*64+x])
  }
  const parent=buildHeightTile(data,0,0,3)
  const child=buildHeightTile(data,0,0,4)
  for(let i=0;i<=32;i++) assert.equal(parent[i],child[i*2])
})

test('cached samples survive Cesium mesh ownership and buffer release', async () => {
  const provider=createTerrainProvider(data)
  const first=await provider.requestTileGeometry(0,0,0)
  const expected=first._buffer[0]
  // Simulate worker transfer/release without relying on a browser or WebGL.
  structuredClone(first._buffer,{transfer:[first._buffer.buffer]})
  const second=await provider.requestTileGeometry(0,0,0)
  assert.equal(second._buffer[0],expected)
  assert.equal(second._buffer.length,65*65)
})

test('rapid camera motion cannot enter source terrain or tilt below the horizon', () => {
  for(let i=0;i<1000;i++) {
    const lon=Math.min(data.bounds[2],data.bounds[0]+(i%101)/100*(data.bounds[2]-data.bounds[0]))
    const lat=Math.min(data.bounds[3],data.bounds[1]+(i%97)/96*(data.bounds[3]-data.bounds[1]))
    const ground=sampleHeight(data,lon,lat)
    assert.ok(Number.isFinite(ground))
    const safe=constrainCamera(data,{longitude:lon,latitude:lat,height:ground-1000,pitch:.8})
    assert.ok(safe.height>=ground+MIN_CLEARANCE-.001)
    assert.equal(safe.pitch,MAX_PITCH)
  }
})

test('normal close views retain negative MOLA heights; escaped views are bounded', () => {
  const pose={longitude:77.40588851,latitude:18.45863707,height:-1500,pitch:-.8}
  assert.deepEqual(constrainCamera(data,pose),pose)
  const escaped=constrainCamera(data,{longitude:100,latitude:50,height:-9000,pitch:-2})
  assert.ok(escaped.longitude<80 && escaped.latitude<21)
  assert.ok(escaped.height>=data.maximumHeight+MIN_CLEARANCE)
  assert.equal(escaped.pitch,-Math.PI/2)
  assert.equal(constrainCamera(data,{...pose,height:NaN}),null)
})
