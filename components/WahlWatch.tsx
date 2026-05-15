interface WahlWatchProps {
  electionCount: number;
}

function daysToElection(): number {
  const election = new Date("2026-09-20T00:00:00+02:00");
  const now = new Date();
  return Math.max(0, Math.ceil((election.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function WahlWatch({ electionCount }: WahlWatchProps) {
  const days = daysToElection();

  return (
    <div className="max-w-2xl lg:max-w-4xl mx-auto px-5 mb-3">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
        style={{
          background: "linear-gradient(95deg, rgba(156,74,46,0.06), rgba(31,78,107,0.06))",
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--brick)", letterSpacing: "0.1em" }}
          >
            Wahl-Watch
          </div>
          <div className="text-xs" style={{ color: "var(--ink)" }}>
            <span
              style={{
                fontFamily: "var(--font-fraunces)",
                fontWeight: 600,
                fontSize: "1rem",
                color: "var(--water-deep)",
              }}
            >
              {days} Tage
            </span>{" "}
            bis zur Abgeordnetenhauswahl
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: "1.25rem",
              color: "var(--brick)",
              lineHeight: 1,
            }}
          >
            {electionCount}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--ink-soft)", letterSpacing: "0.04em" }}>
            wahlrelevant
          </div>
        </div>
      </div>
    </div>
  );
}
