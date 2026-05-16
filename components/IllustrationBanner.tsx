export default function IllustrationBanner() {
  return (
    <svg
      width="100%"
      viewBox="0 0 1200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block", opacity: 0.82 }}
    >
      {/* Reeds — left */}
      <g transform="translate(0, 0)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 70 C22 55, 18 40, 22 20" />
        <path d="M35 70 C37 55, 33 42, 36 18" />
        <path d="M50 70 C52 55, 48 38, 52 16" />
        <ellipse cx="22" cy="16" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.08" />
        <ellipse cx="36" cy="14" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.08" />
        <ellipse cx="52" cy="12" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.08" />
        <line x1="22" y1="10" x2="22" y2="22" strokeOpacity="0.4" />
        <line x1="36" y1="8" x2="36" y2="20" strokeOpacity="0.4" />
        <line x1="52" y1="6" x2="52" y2="18" strokeOpacity="0.4" />
      </g>

      {/* Heron */}
      <g transform="translate(145, 0)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 60 L32 72" />
        <path d="M40 60 L42 72" />
        <path d="M30 50 C30 40, 45 40, 45 50 C45 60, 30 60, 30 50 Z" />
        <path d="M42 48 C48 42, 46 34, 52 28 C56 24, 58 22, 60 20" />
        <path d="M60 20 C62 19, 64 20, 63 22 C61 23, 59 22, 60 20 Z" />
        <path d="M63 21 L70 19" />
        <circle cx="62" cy="21" r="0.8" fill="#143d56" />
        <path d="M32 50 C36 46, 40 46, 44 50" strokeOpacity="0.5" />
        <line x1="20" y1="72" x2="60" y2="72" strokeOpacity="0.2" />
      </g>

      {/* Waves */}
      <g transform="translate(310, 5)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round">
        <path d="M10 30 C20 22, 30 38, 40 30 S60 22, 70 30" />
        <path d="M10 40 C20 32, 30 48, 40 40 S60 32, 70 40" strokeOpacity="0.75" />
        <path d="M10 50 C20 42, 30 58, 40 50 S60 42, 70 50" strokeOpacity="0.5" />
      </g>

      {/* Oak leaf */}
      <g transform="translate(490, 0)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
        <path d="M40 70 C39 58, 40 45, 41 20" />
        <path d="M41 20 C31 23, 28 30, 33 35 C24 36, 22 45, 30 49 C24 55, 30 63, 38 58 C43 65, 54 60, 50 52 C60 51, 61 40, 52 37 C58 30, 52 22, 41 20 Z" fill="#d9e7dc" fillOpacity="0.28" />
        <path d="M40 55 C35 50, 33 45, 30 40" strokeOpacity="0.55" />
        <path d="M41 47 C46 43, 49 39, 53 35" strokeOpacity="0.55" />
        <path d="M40 38 C36 34, 34 30, 32 27" strokeOpacity="0.55" />
      </g>

      {/* Castle */}
      <g transform="translate(630, 0)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="62" x2="74" y2="62" />
        <rect x="12" y="32" width="56" height="30" />
        <path d="M10 32 L20 24 L60 24 L70 32" />
        <line x1="20" y1="24" x2="60" y2="24" />
        <line x1="22" y1="24" x2="22" y2="20" />
        <line x1="32" y1="24" x2="32" y2="20" />
        <line x1="48" y1="24" x2="48" y2="20" />
        <line x1="58" y1="24" x2="58" y2="20" />
        <rect x="30" y="28" width="20" height="34" />
        <path d="M30 28 C30 22, 50 22, 50 28" />
        <rect x="37" y="48" width="6" height="14" rx="1" />
        <rect x="16" y="36" width="3" height="4" />
        <rect x="22" y="36" width="3" height="4" />
        <rect x="16" y="44" width="3" height="4" />
        <rect x="22" y="44" width="3" height="4" />
        <rect x="55" y="36" width="3" height="4" />
        <rect x="61" y="36" width="3" height="4" />
        <rect x="55" y="44" width="3" height="4" />
        <rect x="61" y="44" width="3" height="4" />
        <rect x="34" y="36" width="3" height="4" />
        <rect x="43" y="36" width="3" height="4" />
        <rect x="34" y="42" width="3" height="4" />
        <rect x="43" y="42" width="3" height="4" />
        <line x1="6" y1="66" x2="74" y2="66" strokeOpacity="0.25" />
      </g>

      {/* Carp */}
      <g transform="translate(835, 15)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 40 C20 28, 45 28, 60 40 C45 52, 20 52, 15 40 Z" />
        <path d="M60 40 L70 32 L70 48 Z" />
        <circle cx="22" cy="38" r="1.2" />
        <path d="M15 40 C13 39, 13 41, 15 40" />
        <path d="M35 30 C38 24, 45 24, 48 30" />
        <path d="M35 50 C38 55, 45 55, 48 50" />
        <path d="M28 36 C30 34, 32 34, 34 36" strokeOpacity="0.4" />
        <path d="M28 42 C30 40, 32 40, 34 42" strokeOpacity="0.4" />
        <path d="M36 38 C38 36, 40 36, 42 38" strokeOpacity="0.4" />
        <path d="M36 44 C38 42, 40 42, 42 44" strokeOpacity="0.4" />
      </g>

      {/* Waves — right */}
      <g transform="translate(1010, 10)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
        <path d="M10 30 C20 22, 30 38, 40 30 S60 22, 70 30" />
        <path d="M10 40 C20 32, 30 48, 40 40 S60 32, 70 40" strokeOpacity="0.75" />
      </g>

      {/* Reeds — right */}
      <g transform="translate(1110, 0)" stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        <path d="M20 70 C22 55, 18 40, 22 20" />
        <path d="M35 70 C37 55, 33 42, 36 18" />
        <ellipse cx="22" cy="16" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.08" />
        <ellipse cx="36" cy="14" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.08" />
        <line x1="22" y1="10" x2="22" y2="22" strokeOpacity="0.4" />
        <line x1="36" y1="8" x2="36" y2="20" strokeOpacity="0.4" />
      </g>
    </svg>
  );
}
