import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePoliceRss, parsePoliceHtml } from "./sources/police.mjs";
import { parseEventsHtml } from "./sources/events.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = (name) => readFile(path.join(ROOT, "scripts", "fixtures", name), "utf8");

const policeRss = parsePoliceRss(await fixture("polizei-rss.xml"));
assert.equal(policeRss.length, 1);
assert.equal(policeRss[0].source_id, "polizei-berlin");
assert.ok(policeRss[0].title.toLocaleLowerCase("de-DE").includes("köpenick"));

const policeHtml = parsePoliceHtml(await fixture("polizei-page.html"));
assert.equal(policeHtml.length, 2);
assert.equal(policeHtml[0].location_relevant, true);
assert.ok(policeHtml[0].source_url.includes("pressemitteilung"));
// Eintrag im neueren Markup: Wrapper-Tags zwischen Link und "Ereignisort:"
assert.equal(policeHtml[1].title, "Brand in Friedrichshagen");
assert.ok(policeHtml[1].raw_excerpt.includes("Friedrichshagen"));

const events = parseEventsHtml(await fixture("events-page.html"));
assert.equal(events.length, 2);
assert.equal(events[0].source_id, "berlin-events");
assert.equal(events[0].title, "Kiezfest am Rathaus Köpenick");
assert.ok(!events.some((event) => event.title === "Ausstellungen"));
assert.ok(!events.some((event) => event.title === "Seite 30"));

console.log("parser smoke tests ok");
