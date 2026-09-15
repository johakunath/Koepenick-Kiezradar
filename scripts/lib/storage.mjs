import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";
import { consolidateEntries, entryIdentity } from "../../lib/shared/entry-identity.mjs";
import { berlinDay } from "../../lib/shared/dates.mjs";

export async function atomicJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  // Windows file watchers can briefly lock a JSON file during replacement.
  for (let attempt = 0; ; attempt++) {
    try { await rename(temp, file); break; }
    catch (error) {
      if (attempt >= 4 || !["EPERM", "EBUSY"].includes(error.code)) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}

export function mergeEntries(existing, incoming) {
  const byId = new Map(existing.map(e => [e.id, e]));
  for (const entry of incoming) byId.set(entry.id, { ...byId.get(entry.id), ...entry, is_mock: false });
  return consolidateEntries([...byId.values()]).sort((a, b) => b.published_at.localeCompare(a.published_at));
}

export async function writeArchive(entries, directory) {
  const months = new Map();
  for (const entry of entries) {
    const month = entry.published_at?.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`Invalid archive date for ${entry.id}`);
    months.set(month, [...(months.get(month) ?? []), entry]);
  }
  for (const [month, rows] of months) {
    const file = path.join(directory, `${month}.json`);
    let previous = [];
    try { previous = JSON.parse(await readFile(file, "utf8")); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    await atomicJson(file, mergeEntries(previous, rows));
  }
}

export function retainActiveEntries(entries, now = new Date(), limit = 250) {
  const today = berlinDay(now);
  const upcoming = entries.filter(e => e.event_start_at && berlinDay(e.event_end_at ?? e.event_start_at) >= today)
    .sort((a, b) => a.event_start_at.localeCompare(b.event_start_at));
  const ids = new Set(upcoming.map(e => e.id));
  const recent = entries.filter(e => !ids.has(e.id)).sort((a, b) => b.published_at.localeCompare(a.published_at));
  return [...upcoming, ...recent].slice(0, limit);
}

// Find new records before applying a budget; rotate through sources and event series.
export function selectNewEntries(groups, existing, limit = 25) {
  const known = new Set(existing.map(entryIdentity));
  const queues = groups.map(group => consolidateEntries(group).filter(e => !known.has(entryIdentity(e))));
  const chosen = [];
  while (chosen.length < limit && queues.some(q => q.length)) {
    for (const queue of queues) {
      if (!queue.length || chosen.length >= limit) continue;
      const indexOfNewSeries = queue.findIndex(e => !chosen.some(chosen => chosen.title === e.title));
      const entry = queue.splice(indexOfNewSeries >= 0 ? indexOfNewSeries : 0, 1)[0];
      const key = entryIdentity(entry);
      if (known.has(key)) continue;
      chosen.push(entry);
      known.add(key);
      // Interleave different titles so a daily exhibition cannot take the entire budget.
      const index = queue.findIndex(e => e.title !== entry.title);
      if (index > 0) queue.unshift(...queue.splice(index, 1));
    }
  }
  return chosen;
}
