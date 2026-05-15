import Link from "next/link";
import { CalendarDays } from "lucide-react";
import RadarNav from "@/components/RadarNav";
import { getMeetings } from "@/lib/data";

export default function MeetingsPage() {
  const meetings = getMeetings();

  return (
    <main className="min-h-screen px-5 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl lg:max-w-4xl mx-auto">
        <RadarNav />
        <Link href="/" className="text-xs font-medium" style={{ color: "var(--water-mid)" }}>
          ← Zum Feed
        </Link>
        <h1 className="text-3xl mt-4 mb-6" style={{ fontFamily: "var(--font-fraunces)", color: "var(--water-deep)" }}>
          Termine
        </h1>
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.slug}
              href={`/termin/${meeting.slug}`}
              className="block p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10 }}
            >
              <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--forest)" }}>
                <CalendarDays size={14} />
                {new Date(meeting.meeting_at).toLocaleString("de-DE")}
              </div>
              <h2 className="text-lg" style={{ fontFamily: "var(--font-fraunces)", color: "var(--ink)" }}>
                {meeting.title}
              </h2>
              <p className="text-sm mt-2" style={{ color: "var(--ink-soft)" }}>
                {meeting.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
