import logo from '../NASA Space Apps Logos - 2026/Space Apps Logo Color and White.svg'
export default function SpaceLoader() {
  return <div className="space-loader" role="status"><div className="space-loader-logo" aria-hidden="true"><img src={logo} alt="" /><img className="space-loader-fill" src={logo} alt="" /></div><span>Loading Mars view…</span></div>
}
