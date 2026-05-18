import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import Header from "@/components/Header";
import { getMeetings } from "@/lib/data";

export const metadata: Metadata = {
  title: "Termine – Köpenick Kiezradar",
  description: "Veranstaltungen und offizielle Termine in Berlin-Köpenick.",
  openGraph: {
    title: "Termine – Köpenick Kiezradar",
    description: "Veranstaltungen und offizielle Termine in Berlin-Köpenick.",
  },
};

export default function MeetingsPage() {
  const meetings = getMeetings();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Header />
      <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8">
        <h1 style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500, fontSize: "clamp(22px, 2.5vw, 30px)", color: "var(--ink)", marginBottom: 24 }}>
          Termine
        </h1>
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Link
              key={meeting.slug}
              href={`/termin/${meeting.slug}`}
              className="block p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none" }}
            >
              <div className="flex items-center gap-2 text-xs mb-2" style={{ color: "var(--reed)" }}>
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
    </div>
  );
}
