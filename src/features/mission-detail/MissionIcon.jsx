// Small line icons following the Space Apps lightweight symbol guidance.
export default function MissionIcon({ name, size = 18 }) {
  const paths = {
    'arrow-up-right': <><path d="M7 17 17 7M7 7h10v10" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    'chevron-left': <path d="m15 5-7 7 7 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    locate: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
    expand: <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />,
    'panel-close': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16m-7-11 3 3-3 3" /></>,
    'panel-open': <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M14 4v16m-3-11-3 3 3 3" /></>,
    return: <path d="m9 14-5-5 5-5M4 9h10a6 6 0 0 1 6 6v5" />,
    speaker: <><path d="m11 5-6 4H2v6h3l6 4V5Z" /><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1" />,
    alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 3v.5" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
