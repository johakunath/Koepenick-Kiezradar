export default function Footer() {
  return (
    <footer className="mt-12 pb-10 px-5">
      <div className="max-w-2xl mx-auto">
        <div
          className="mb-6"
          style={{
            height: "24px",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 24' preserveAspectRatio='none'%3E%3Cpath d='M0 12 Q 150 0 300 12 T 600 12 T 900 12 T 1200 12' fill='none' stroke='%233a7396' stroke-opacity='0.25' stroke-width='1.5'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat-x",
            backgroundSize: "1200px 24px",
          }}
        />
        <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
          <p className="mb-2">
            <span style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}>
              Köpenick Kiezradar
            </span>{" "}
            · Iteration 2 vorbereitet · Mock- und künftig Echt-Daten
          </p>
          <p className="leading-relaxed">
            Privates Lern- und Experimentierprojekt. Keine offizielle Quelle. Alle Inhalte sind
            KI-generiert und können falsch sein. Originalquellen sind verlinkt und maßgeblich.
          </p>
        </div>
      </div>
    </footer>
  );
}
