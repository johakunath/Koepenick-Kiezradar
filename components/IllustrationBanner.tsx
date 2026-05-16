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
      <g stroke="#143d56" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">

        <line x1="40" y1="64" x2="1160" y2="64" strokeOpacity="0.2" />

        {/* Heron */}
        <g transform="translate(80,0)">
          <path d="M0 50 L-2 64" />
          <path d="M6 50 L8 64" />
          <path d="M-4 42 C-4 34, 10 34, 10 42 C10 50, -4 50, -4 42 Z" />
          <path d="M8 40 C16 32, 14 24, 22 18 C26 14, 30 12, 34 10" />
          <path d="M34 10 C36 9, 38 10, 37 12 C35 13, 33 12, 34 10 Z" />
          <path d="M37 11 L48 8" />
        </g>

        {/* Reeds */}
        <g transform="translate(200,0)">
          <path d="M0 64 C2 48, -2 34, 2 18" />
          <path d="M14 64 C16 48, 12 34, 16 16" />
          <path d="M28 64 C30 48, 26 32, 30 14" />
          <ellipse cx="2" cy="14" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.06" />
          <ellipse cx="16" cy="12" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.06" />
          <ellipse cx="30" cy="10" rx="2.5" ry="6" fill="#143d56" fillOpacity="0.06" />
        </g>

        {/* Waves */}
        <g transform="translate(360,0)">
          <path d="M0 48 C40 40, 80 56, 120 48 S200 40, 240 48" />
          <path d="M0 56 C40 48, 80 64, 120 56 S200 48, 240 56" strokeOpacity="0.6" />
        </g>

        {/* Castle */}
        <g transform="translate(750,0)">
          <rect x="0" y="34" width="220" height="30" />
          <path d="M-6 34 L30 20 L190 20 L226 34" />
          <line x1="30" y1="20" x2="190" y2="20" />
          <line x1="50" y1="20" x2="50" y2="14" />
          <line x1="90" y1="20" x2="90" y2="14" />
          <line x1="140" y1="20" x2="140" y2="14" />
          <line x1="180" y1="20" x2="180" y2="14" />
          <rect x="80" y="30" width="60" height="34" />
          <path d="M80 30 C80 22, 140 22, 140 30" />
          <rect x="104" y="48" width="12" height="16" rx="1" />
          <rect x="20" y="40" width="6" height="6" />
          <rect x="40" y="40" width="6" height="6" />
          <rect x="20" y="50" width="6" height="6" />
          <rect x="40" y="50" width="6" height="6" />
          <rect x="174" y="40" width="6" height="6" />
          <rect x="194" y="40" width="6" height="6" />
          <rect x="174" y="50" width="6" height="6" />
          <rect x="194" y="50" width="6" height="6" />
        </g>

      </g>
    </svg>
  );
}
