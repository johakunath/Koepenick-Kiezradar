import Link from "next/link";

interface HeaderProps {
  count: number;
}

function WaveLogo() {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" aria-hidden="true">
      <path
        d="M2 14 Q 7 9 12 14 T 22 14 T 30 14"
        stroke="var(--water-deep)"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M2 19 Q 7 14 12 19 T 22 19 T 30 19"
        stroke="var(--water-mid)"
        strokeWidth="1.8"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

export default function Header({ count }: HeaderProps) {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="pt-8 pb-6 px-5"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(58,115,150,0.08), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(74,107,58,0.06), transparent 50%)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <WaveLogo />
            <h1
              className="text-3xl"
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--water-deep)",
              }}
            >
              Köpenick Radar
            </h1>
          </div>
          <Link
            href="/woche"
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--water-mid)" }}
          >
            Diese Woche →
          </Link>
        </div>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--ink-soft)", fontStyle: "italic" }}
        >
          Was in unserem Kiez passiert
        </p>
        <div className="flex items-baseline gap-3 text-xs" style={{ color: "var(--ink-soft)" }}>
          <span
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            {today}
          </span>
          <span>·</span>
          <span>{count} aktuelle Einträge</span>
        </div>
      </div>
    </header>
  );
}
