import React, { useState, useMemo } from 'react';
import { ArrowUpRight, AlertCircle, X, MapPin, Vote } from 'lucide-react';

// ---------- Mock-Daten ----------

const ENTRIES = [
  {
    id: '1',
    source: 'Polizei Berlin',
    source_url: 'https://www.berlin.de/polizei/polizeimeldungen/',
    title: 'Einbruchsserie in der Altstadt Köpenick',
    published_at: '2026-05-14T09:30:00Z',
    ai_summary: 'Vier Einbrüche in Geschäfte der Alt-Köpenicker Innenstadt zwischen 6. und 12. Mai. Polizei sucht Zeugen.',
    tags: ['sicherheit'],
    location: 'Altstadt Köpenick',
    local_relevance_score: 0.95,
    political_relevance_score: 0.4,
    election_relevant: true,
    election_topic: 'Innere Sicherheit',
    ai_reasoning: 'Direkter Bezug zur Altstadt, Wahlkampfthema Innere Sicherheit ist aktiv.'
  },
  {
    id: '2',
    source: 'BVV Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/',
    title: 'CDU-Antrag: Mehr Polizeipräsenz am S-Bahnhof Köpenick',
    published_at: '2026-05-13T18:00:00Z',
    ai_summary: 'CDU-Fraktion bringt Antrag in die BVV ein, das Bezirksamt möge sich für eine permanente Polizeipräsenz am Bahnhof Köpenick einsetzen.',
    tags: ['politik', 'sicherheit'],
    location: 'Bahnhof Köpenick',
    local_relevance_score: 0.88,
    political_relevance_score: 0.92,
    election_relevant: true,
    election_topic: 'Innere Sicherheit',
    ai_reasoning: 'BVV-Antrag mit direktem Bezug zu Köpenick und Wahlkampfthema.'
  },
  {
    id: '3',
    source: 'Bezirksamt Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/',
    title: 'Sanierung Strandbad Müggelsee verzögert sich um zwei Monate',
    published_at: '2026-05-13T11:15:00Z',
    ai_summary: 'Wiedereröffnung des Strandbads erst Mitte Juli statt Mai. Grund: Verzögerungen bei der Wasserleitungssanierung.',
    tags: ['infrastruktur'],
    location: 'Müggelsee',
    local_relevance_score: 0.7,
    political_relevance_score: 0.2,
    election_relevant: false,
    ai_reasoning: 'Lokal hochrelevant für Anwohner und Sommer-Aktivitäten in Köpenick.'
  },
  {
    id: '4',
    source: 'VIZ Berlin',
    source_url: 'https://viz.berlin.de/',
    title: 'Vollsperrung Spindlersfelder Straße ab 18. Mai',
    published_at: '2026-05-13T08:00:00Z',
    ai_summary: 'Wegen Kanalbauarbeiten wird die Spindlersfelder Straße zwischen Schnellerstraße und An der Wuhlheide vom 18. Mai bis 7. Juli vollständig gesperrt.',
    tags: ['verkehr', 'infrastruktur'],
    location: 'Spindlersfeld',
    local_relevance_score: 0.92,
    political_relevance_score: 0.15,
    election_relevant: false,
    ai_reasoning: 'Lange Sperrung mit erheblichem Einfluss auf den Alltag in Spindlersfeld.'
  },
  {
    id: '5',
    source: 'Bezirksamt Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/',
    title: 'Neue Öffnungszeiten Bürgeramt Köpenick ab Juni',
    published_at: '2026-05-12T14:00:00Z',
    ai_summary: 'Bürgeramt Köpenick öffnet ab Juni dienstags und donnerstags eine Stunde länger. Wegfall der Mittwoch-Öffnung.',
    tags: ['verwaltung'],
    location: 'Köpenick zentral',
    local_relevance_score: 0.78,
    political_relevance_score: 0.25,
    election_relevant: false,
    ai_reasoning: 'Alltagsrelevant, aber wenig politisch aufgeladen.'
  },
  {
    id: '6',
    source: 'BVV Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/politik-und-verwaltung/bezirksverordnetenversammlung/',
    title: 'BVV beschließt Resolution zu Schulplatzmangel in Spindlersfeld',
    published_at: '2026-05-12T20:30:00Z',
    ai_summary: 'Mit Mehrheit von SPD, Grünen und Linken beschließt die BVV eine Resolution, die vom Senat einen neuen Grundschulstandort in Spindlersfeld fordert.',
    tags: ['politik', 'verwaltung'],
    location: 'Spindlersfeld',
    local_relevance_score: 0.85,
    political_relevance_score: 0.9,
    election_relevant: true,
    election_topic: 'Bildung',
    ai_reasoning: 'Klares Wahlkampfthema Bildung, direkt mit Wahlkreis verknüpft.'
  },
  {
    id: '7',
    source: 'Polizei Berlin',
    source_url: 'https://www.berlin.de/polizei/polizeimeldungen/',
    title: 'Verkehrsunfall an der Kreuzung Lindenstraße/Bahnhofstraße',
    published_at: '2026-05-11T17:45:00Z',
    ai_summary: 'Bei einem Zusammenstoß zwischen PKW und Radfahrer wurde der Radfahrer leicht verletzt. Verkehrsbehinderungen über 90 Minuten.',
    tags: ['verkehr', 'sicherheit'],
    location: 'Altstadt Köpenick',
    local_relevance_score: 0.6,
    political_relevance_score: 0.3,
    election_relevant: false,
    ai_reasoning: 'Einzelfall, aber Hinweis auf bekannte Gefahrenstelle.'
  },
  {
    id: '8',
    source: 'Bezirksamt Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/',
    title: 'Notfallpunkte für Stromausfälle in Köpenick eingerichtet',
    published_at: '2026-05-10T10:00:00Z',
    ai_summary: 'Als Konsequenz aus dem Blackout vom Januar 2026 hat das Bezirksamt drei feste Notfallpunkte in Köpenick benannt, an denen bei Stromausfall Informationen und Wärme verfügbar sein sollen.',
    tags: ['infrastruktur', 'politik'],
    location: 'Köpenick gesamt',
    local_relevance_score: 0.82,
    political_relevance_score: 0.7,
    election_relevant: true,
    election_topic: 'Sicherheit / Resilienz',
    ai_reasoning: 'Direkte Reaktion auf das Blackout-Trauma, Resilienz ist Wahlthema.'
  },
  {
    id: '9',
    source: 'Landeswahlleiter Berlin',
    source_url: 'https://www.berlin.de/wahlen/',
    title: 'Treptow-Köpenick erhält für Wahl 2026 zusätzlichen Wahlkreis',
    published_at: '2026-05-09T12:00:00Z',
    ai_summary: 'Für die Abgeordnetenhauswahl am 20. September 2026 wird Treptow-Köpenick einen siebten Wahlkreis bekommen. Köpenick-Altstadt und Dammvorstadt werden neu zugeschnitten.',
    tags: ['politik'],
    location: 'Treptow-Köpenick gesamt',
    local_relevance_score: 0.7,
    political_relevance_score: 1.0,
    election_relevant: true,
    election_topic: 'Wahl 2026',
    ai_reasoning: 'Wahl-organisatorisch zentral, direkter Bezug zum Bezirk.'
  },
  {
    id: '10',
    source: 'Bezirksamt Treptow-Köpenick',
    source_url: 'https://www.berlin.de/ba-treptow-koepenick/',
    title: 'Bauantrag für 84 neue Wohnungen in der Dammvorstadt eingereicht',
    published_at: '2026-05-08T16:00:00Z',
    ai_summary: 'Ein privater Investor hat einen Bauantrag für 84 Wohnungen auf einer Brachfläche in der Dammvorstadt eingereicht. Mietpreisbindung für 30 Prozent der Wohnungen vorgesehen.',
    tags: ['infrastruktur', 'politik'],
    location: 'Dammvorstadt',
    local_relevance_score: 0.9,
    political_relevance_score: 0.85,
    election_relevant: true,
    election_topic: 'Wohnen',
    ai_reasoning: 'Wohnen ist das Top-Wahlthema, konkreter Bauantrag in unmittelbarer Nachbarschaft.'
  }
];

const TAG_DEFS = [
  { id: 'verkehr', label: 'Verkehr' },
  { id: 'sicherheit', label: 'Sicherheit' },
  { id: 'verwaltung', label: 'Verwaltung' },
  { id: 'politik', label: 'Politik & Wahl' },
  { id: 'infrastruktur', label: 'Infrastruktur' },
  { id: 'sonstiges', label: 'Sonstiges' }
];

// ---------- Helpers ----------

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
}

function timeAgo(iso) {
  const now = new Date('2026-05-14T17:00:00Z');
  const d = new Date(iso);
  const hours = Math.floor((now - d) / (1000 * 60 * 60));
  if (hours < 24) return `vor ${hours} h`;
  return `vor ${Math.floor(hours / 24)} Tag${Math.floor(hours / 24) > 1 ? 'en' : ''}`;
}

// ---------- Styles ----------

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600&display=swap');

  :root {
    --bg: #f4ede0;
    --bg-card: #faf6ec;
    --water-deep: #1f4e6b;
    --water-mid: #3a7396;
    --water-light: #c9dde6;
    --forest: #4a6b3a;
    --sand: #d4c4a8;
    --ink: #1a2933;
    --ink-soft: #4a5a64;
    --brick: #9c4a2e;
    --border: #e0d6c2;
  }

  .kr-app {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Inter Tight', system-ui, sans-serif;
    min-height: 100vh;
    font-feature-settings: 'ss01', 'ss02';
  }
  
  .kr-display { font-family: 'Fraunces', Georgia, serif; }
  
  .kr-wave-bg {
    background-image: 
      radial-gradient(ellipse at 20% 0%, rgba(58, 115, 150, 0.08), transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(74, 107, 58, 0.06), transparent 50%);
  }

  .kr-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    transition: all 0.15s ease;
  }
  .kr-card:hover {
    border-color: var(--water-mid);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px -8px rgba(31, 78, 107, 0.2);
  }

  .kr-chip {
    transition: all 0.12s ease;
    font-feature-settings: 'ss01';
  }
  .kr-chip-inactive {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--ink-soft);
  }
  .kr-chip-inactive:hover {
    border-color: var(--water-mid);
    color: var(--water-deep);
  }
  .kr-chip-active {
    background: var(--water-deep);
    border: 1px solid var(--water-deep);
    color: var(--bg);
  }

  .kr-wave-divider {
    height: 24px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 24' preserveAspectRatio='none'%3E%3Cpath d='M0 12 Q 150 0 300 12 T 600 12 T 900 12 T 1200 12' fill='none' stroke='%233a7396' stroke-opacity='0.25' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-size: 1200px 24px;
  }

  .kr-link:hover { color: var(--water-deep); }

  .kr-tag-mini {
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .kr-relevance-bar {
    height: 3px;
    background: var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .kr-relevance-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--water-mid), var(--water-deep));
  }

  .kr-election-badge {
    background: linear-gradient(135deg, rgba(156, 74, 46, 0.08), rgba(156, 74, 46, 0.15));
    color: var(--brick);
    border: 1px solid rgba(156, 74, 46, 0.2);
  }
`;

// ---------- Components ----------

function TagChip({ tag, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`kr-chip ${active ? 'kr-chip-active' : 'kr-chip-inactive'} px-3 py-1.5 rounded-full text-sm whitespace-nowrap`}
    >
      {tag.label}
    </button>
  );
}

function EntryCard({ entry }) {
  return (
    <article className="kr-card rounded-lg p-5">
      {/* Tag-Mini-Zeile */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {entry.tags.map(t => {
          const def = TAG_DEFS.find(d => d.id === t);
          return (
            <span key={t} className="kr-tag-mini" style={{ color: 'var(--water-deep)' }}>
              {def?.label || t}
            </span>
          );
        }).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`s${i}`} className="kr-tag-mini" style={{ color: 'var(--ink-soft)' }}>·</span>, el], [])}
        {entry.election_relevant && (
          <span className="kr-election-badge kr-tag-mini ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full">
            <Vote size={11} />
            {entry.election_topic}
          </span>
        )}
      </div>

      {/* Titel */}
      <h2 className="kr-display text-xl leading-snug mb-2" style={{ fontWeight: 500, letterSpacing: '-0.01em' }}>
        {entry.title}
      </h2>

      {/* Summary */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--ink-soft)' }}>
        {entry.ai_summary}
      </p>

      {/* Relevanz-Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--ink-soft)' }}>
          <span>Lokale Relevanz</span>
          <span style={{ fontFamily: 'Fraunces', fontWeight: 500 }}>{Math.round(entry.local_relevance_score * 100)}%</span>
        </div>
        <div className="kr-relevance-bar">
          <div className="kr-relevance-fill" style={{ width: `${entry.local_relevance_score * 100}%` }} />
        </div>
      </div>

      {/* Footer-Zeile */}
      <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {entry.location}
          </span>
          <span>{timeAgo(entry.published_at)}</span>
        </div>
        <a
          href={entry.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="kr-link flex items-center gap-1 text-xs font-medium"
          style={{ color: 'var(--water-mid)' }}
        >
          {entry.source}
          <ArrowUpRight size={12} />
        </a>
      </div>
    </article>
  );
}

function Header({ count }) {
  return (
    <header className="kr-wave-bg pt-8 pb-6 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-baseline gap-2 mb-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M2 14 Q 6 10 10 14 T 18 14 T 26 14" stroke="var(--water-deep)" strokeWidth="1.5" fill="none" />
            <path d="M2 18 Q 6 14 10 18 T 18 18 T 26 18" stroke="var(--water-mid)" strokeWidth="1.5" fill="none" opacity="0.6" />
          </svg>
          <h1 className="kr-display text-3xl" style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--water-deep)' }}>
            Köpenick Radar
          </h1>
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>
          Was in unserem Kiez passiert
        </p>
        <div className="flex items-baseline gap-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
          <span style={{ fontFamily: 'Fraunces', fontWeight: 500, color: 'var(--ink)' }}>
            Donnerstag, 14. Mai 2026
          </span>
          <span>·</span>
          <span>{count} aktuelle Einträge</span>
        </div>
      </div>
    </header>
  );
}

function DisclaimerBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="mx-5 max-w-2xl mx-auto px-4 py-3 rounded-lg flex items-start gap-3 text-xs" style={{ background: 'rgba(58, 115, 150, 0.08)', border: '1px solid var(--water-light)', color: 'var(--water-deep)' }}>
      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
      <p className="flex-1 leading-relaxed">
        Privates Spielzeug zweier Nachbarn. KI-Inhalte können falsch sein, maßgeblich sind die verlinkten Originalquellen.
      </p>
      <button onClick={() => setVisible(false)} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 pb-10 px-5">
      <div className="max-w-2xl mx-auto">
        <div className="kr-wave-divider mb-6" />
        <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
          <p className="mb-2">
            <span style={{ fontFamily: 'Fraunces', fontWeight: 500 }}>Köpenick Radar</span> · Iteration 0 · Mock-Daten
          </p>
          <p className="leading-relaxed">
            Privates Lern- und Experimentierprojekt. Keine offizielle Quelle. Alle Inhalte sind KI-generiert und können falsch sein. Originalquellen sind verlinkt und maßgeblich.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------- App ----------

export default function KoepenickRadar() {
  const [activeTags, setActiveTags] = useState([]);

  const toggleTag = (tagId) => {
    setActiveTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const filtered = useMemo(() => {
    if (activeTags.length === 0) return ENTRIES;
    return ENTRIES.filter(e => e.tags.some(t => activeTags.includes(t)));
  }, [activeTags]);

  return (
    <>
      <style>{css}</style>
      <div className="kr-app">
        <Header count={ENTRIES.length} />

        <div className="mb-4">
          <DisclaimerBanner />
        </div>

        {/* Filter-Leiste */}
        <div className="px-5 mb-6 sticky top-0 z-10 py-3" style={{ background: 'var(--bg)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {TAG_DEFS.map(tag => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  active={activeTags.includes(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
              {activeTags.length > 0 && (
                <button
                  onClick={() => setActiveTags([])}
                  className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feed */}
        <main className="px-5">
          <div className="max-w-2xl mx-auto space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-sm" style={{ color: 'var(--ink-soft)' }}>
                Keine Einträge mit diesen Tags.
              </div>
            ) : (
              filtered.map(entry => <EntryCard key={entry.id} entry={entry} />)
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
