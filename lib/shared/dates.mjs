export const TIME_ZONE = "Europe/Berlin";

export function berlinDay(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function addDays(day, count) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

// Resolve Berlin wall time independently of the machine/CI timezone; reject DST gaps.
export function berlinDateTime(year, month, day, hour = 12, minute = 0) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  let timestamp = wall;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(parts.formatToParts(new Date(timestamp)).map(p => [p.type, p.value]));
    const delta = wall - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    if (!delta) return new Date(timestamp).toISOString();
    timestamp += delta;
  }
  return null;
}

export function parseSourceDate(text) {
  const match = String(text).match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s*(?:um\s*)?(\d{1,2}):(\d{2}))?/);
  if (!match) return null;
  const [, d, m, y, h, min] = match;
  const calendar = new Date(Date.UTC(+y, +m - 1, +d));
  if (calendar.getUTCFullYear() !== +y || calendar.getUTCMonth() !== +m - 1 || calendar.getUTCDate() !== +d || +(h ?? 12) > 23 || +(min ?? 0) > 59) return null;
  const iso = berlinDateTime(+y, +m, +d, +(h ?? 12), +(min ?? 0));
  return iso ? { iso, precision: h ? "time" : "day" } : null;
}

// Never date AI prose. Missing years require a narrow publication context.
export function eventDateFromTitle(title, publishedAt) {
  const months = ["januar", "februar", "märz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"];
  const text = title.toLocaleLowerCase("de-DE");
  if (/\b(?:bis|vom)\b|\d\.?\s*[–—-]\s*\d/.test(text)) return null;
  const written = text.match(/\bam\s+(\d{1,2})\.\s+([a-zä]+)\s+(\d{4})\b/);
  if (written && months.includes(written[2])) return parseSourceDate(`${written[1]}.${months.indexOf(written[2]) + 1}.${written[3]}`);
  const dates = [...text.matchAll(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g)];
  if (dates.length) return dates.length === 1 ? parseSourceDate(dates[0][0]) : null;
  const partial = text.match(/\bam\s+(\d{1,2})\.\s+([a-zä]+)\b(?!\s+\d{4})/);
  const published = publishedAt && berlinDay(publishedAt);
  if (!partial || !months.includes(partial[2]) || !published) return null;
  const year = Number(published.slice(0, 4));
  // Upcoming announcements only, within 90 days of publication. No historical guesses.
  for (const candidateYear of [year, year + 1]) {
    const candidate = parseSourceDate(`${partial[1]}.${months.indexOf(partial[2]) + 1}.${candidateYear}`);
    if (candidate && berlinDay(candidate.iso) >= published && berlinDay(candidate.iso) <= addDays(published, 90)) return { ...candidate, inferredYear: true };
  }
  return null;
}
