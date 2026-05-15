import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import RadarNav from "@/components/RadarNav";
import { getBodies, getMeetingBySlug, getMeetings } from "@/lib/data";

export function generateStaticParams() {
  return getMeetings().map((meeting) => ({ slug: meeting.slug }));
}

export default async function MeetingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meeting = getMeetingBySlug(slug);
  if (!meeting) notFound();
  const body = meeting.body_slug
    ? getBodies().find((candidate) => candidate.slug === meeting.body_slug)
    : undefined;

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <RadarNav />
        <Link href="/termine" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Alle Termine
        </Link>
        <article
          className="mt-6 p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12 }}
        >
          <p className="text-xs uppercase mb-2" style={{ color: "var(--forest)", letterSpacing: "0.08em" }}>
            {meeting.kind}
          </p>
          <h1 className="text-3xl leading-tight mb-4" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
            {meeting.title}
          </h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--ink-soft)" }}>
            {meeting.summary}
          </p>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm mb-6">
            <div>
              <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                Zeit
              </dt>
              <dd className="flex items-center gap-1">
                <CalendarDays size={14} />
                {new Date(meeting.meeting_at).toLocaleString("de-DE")}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                Ort
              </dt>
              <dd className="flex items-center gap-1">
                <MapPin size={14} />
                {meeting.place}
              </dd>
            </div>
            {body && (
              <div>
                <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                  Gremium
                </dt>
                <dd>{body.name}</dd>
              </div>
            )}
            {meeting.agenda_item && (
              <div>
                <dt className="text-xs uppercase" style={{ color: "var(--ink-soft)", letterSpacing: "0.06em" }}>
                  Tagesordnung
                </dt>
                <dd>{meeting.agenda_item}</dd>
              </div>
            )}
          </dl>
          <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
            {meeting.public_note}
          </p>
          <a
            href={meeting.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: "var(--water-mid)" }}
          >
            Quelle öffnen <ArrowUpRight size={14} />
          </a>
        </article>
      </div>
    </main>
  );
}
