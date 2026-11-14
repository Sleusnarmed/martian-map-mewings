import { useRef, useState } from 'react'
import region from './region.json'
import { JEZERO_POINTS } from './pointsOfInterest'

const [west, south, east, north] = region.bounds
const HEIGHT = 1000 * (north - south) / ((east - west) * Math.cos((north + south) / 2 * Math.PI / 180))
const locate = (point) => [(point.longitude - west) / (east - west) * 1000, (north - point.latitude) / (north - south) * HEIGHT]
const center = locate(region.center)
const mock = locate(region.mockPosition)
const wildcat = locate(JEZERO_POINTS[0])

/** No Cesium or elevation binary required: this view uses a small derived WebP. */
export default function TerrainPreview({ onImageReady, message = 'Preparing detailed relief…', onOpenDetail, error }) {
  const [box, setBox] = useState({ x: 0, y: 0, width: 1000, height: HEIGHT })
  const [imageFailed, setImageFailed] = useState(false)
  const drag = useRef(null)
  const svg = useRef(null)
  function zoom(factor) {
    setBox(b => {
      const width = Math.max(180, Math.min(1000, b.width * factor))
      const height = width * HEIGHT / 1000
      return { x: Math.max(0, Math.min(1000-width, b.x+(b.width-width)/2)), y: Math.max(0, Math.min(HEIGHT-height, b.y+(b.height-height)/2)), width, height }
    })
  }
  function pointerPosition(event) {
    const point = new DOMPoint(event.clientX, event.clientY)
    return point.matrixTransform(svg.current.getScreenCTM().inverse())
  }
  const textSize = 17 * box.width / 1000
  return <div className="terrain-preview">
    <svg ref={svg} className="preview-canvas" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="img" aria-label="2D Jezero shaded relief, crater center, Wildcat Ridge and a mock astronaut position"
      onPointerDown={e => { if (e.button !== 0) return; drag.current = pointerPosition(e); e.currentTarget.setPointerCapture(e.pointerId) }}
      onPointerMove={e => { if (!drag.current) return; const point = pointerPosition(e); const previous = drag.current; setBox(b => ({...b,x:Math.max(0,Math.min(1000-b.width,b.x+previous.x-point.x)),y:Math.max(0,Math.min(HEIGHT-b.height,b.y+previous.y-point.y))})); }}
      onPointerUp={e => { drag.current=null; e.currentTarget.releasePointerCapture(e.pointerId) }} onPointerCancel={() => { drag.current=null }}>
      <image href={`${import.meta.env.BASE_URL}terrain/jezero/preview.webp`} width="1000" height={HEIGHT} preserveAspectRatio="none" onLoad={onImageReady} onError={() => { setImageFailed(true); onImageReady?.() }} />
      <g className="preview-map-labels" fontSize={textSize}>
        <circle cx={center[0]} cy={center[1]} r={7*box.width/1000} fill="none" stroke="white" strokeWidth={2*box.width/1000}/>
        <text x={center[0]+14*box.width/1000} y={center[1]-12*box.width/1000}>JEZERO CRATER</text>
        <text x={center[0]+14*box.width/1000} y={center[1]+10*box.width/1000} fontSize={textSize*.8}>Published center · 18.41° N, 77.69° E</text>
        <circle cx={wildcat[0]} cy={wildcat[1]} r={5*box.width/1000} fill="#eafe07"/>
        <text x={wildcat[0]-12*box.width/1000} y={wildcat[1]-16*box.width/1000} textAnchor="end">Wildcat Ridge</text>
        <g transform={`translate(${mock[0]},${mock[1]}) scale(${box.width/1000})`}>
          <path d="M0 -18 11 13 0 7 -11 13Z" transform={`rotate(${region.mockPosition.headingDegrees})`} fill="#67e8f9" stroke="#142a31" strokeWidth="2"/>
          <text x="19" y="30" fontSize="16">YOU ARE HERE · MOCK</text>
        </g>
      </g>
    </svg>
    <div className="preview-context"><strong>Syrtis Major</strong><span>Regional context / Jezero crater</span></div>
    <div className="preview-north" aria-label="North is up">N ↑</div>
    <div className="preview-tools"><button onClick={() => zoom(.65)} aria-label="Zoom in on 2D map">+</button><button onClick={() => zoom(1/.65)} aria-label="Zoom out on 2D map">−</button><button onClick={() => setBox({x:0,y:0,width:1000,height:HEIGHT})}>Reset 2D</button></div>
    <div className="preview-status"><span role="status">{imageFailed ? 'Preview image unavailable.' : error || message}</span>{onOpenDetail && <button onClick={onOpenDetail}>Open 2.5D relief</button>}</div>
    <div className="preview-credit">NASA / JPL / USGS CTX · Derived shaded relief · Position and heading are a mockup</div>
  </div>
}
