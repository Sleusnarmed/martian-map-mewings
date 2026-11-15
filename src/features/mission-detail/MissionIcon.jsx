// Small line icons following the Space Apps lightweight symbol guidance.
export default function MissionIcon({ name, size = 18 }) {
  const paths = {
    microphone: <><rect x="8" y="2" width="8" height="13" rx="4" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    layers: <><path d="m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4" /></>,
    'arrow-up-right': <><path d="M7 17 17 7M7 7h10v10" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    'chevron-left': <path d="m15 5-7 7 7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m12 5 4 12-4-3-4 3 4-12Z" /></>,
    'arrow-up': <path d="M12 20V4m-6 6 6-6 6 6" />,
    'arrow-down': <path d="M12 4v16m-6-6 6 6 6-6" />,
    'arrow-left': <path d="M20 12H4m6-6-6 6 6 6" />,
    'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6" />,
    minus: <path d="M5 12h14" />,
    locate: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
    expand: <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />,
    'panel-close': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16m-7-11 3 3-3 3" /></>,
    'panel-open': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16m-3-11-3 3 3 3" /></>,
    return: <path d="m9 14-5-5 5-5M4 9h10a6 6 0 0 1 6 6v5" />,
    speaker: <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
    'speaker-muted': <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="m16 9 6 6m0-6-6 6" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
    alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 3v.5" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
