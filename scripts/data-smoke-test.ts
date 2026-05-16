import assert from "node:assert/strict";
import { searchEntries } from "../lib/data.js";
import type { Entry } from "../lib/types.js";

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: "test-id",
    source: "Test Source",
    source_url: "https://example.com",
    title: "Testeintrag Köpenick",
    published_at: new Date().toISOString(),
    ingested_at: new Date().toISOString(),
    ai_summary: "Eine Zusammenfassung.",
    tags: ["verwaltung"],
    location: "Köpenick",
    local_relevance_score: 0.5,
    political_relevance_score: 0.1,
    election_relevant: false,
    ...overrides,
  };
}

// searchEntries — empty query returns all
{
  const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b" })];
  const result = searchEntries(entries, "");
  assert.equal(result.length, 2, "empty query should return all entries");
}

// searchEntries — matches title
{
  const entries = [
    makeEntry({ id: "a", title: "Baustelle Bahnhofstraße" }),
    makeEntry({ id: "b", title: "Stadtrat-Sitzung im Rathaus" }),
  ];
  const result = searchEntries(entries, "bahnhof");
  assert.equal(result.length, 1, "should match by title");
  assert.equal(result[0].id, "a");
}

// searchEntries — matches location
{
  const entries = [
    makeEntry({ id: "a", location: "Friedrichshagen" }),
    makeEntry({ id: "b", location: "Adlershof" }),
  ];
  const result = searchEntries(entries, "friedrichshagen");
  assert.equal(result.length, 1, "should match by location");
}

// searchEntries — matches source
{
  const entries = [
    makeEntry({ id: "a", source: "Polizei Berlin" }),
    makeEntry({ id: "b", source: "Bezirksamt Treptow-Köpenick" }),
  ];
  const result = searchEntries(entries, "polizei");
  assert.equal(result.length, 1, "should match by source");
}

// searchEntries — matches ai_summary
{
  const entries = [
    makeEntry({ id: "a", ai_summary: "Wasserrohrbruch in der Spindlersfelder Straße." }),
    makeEntry({ id: "b", ai_summary: "Neues Kitaprojekt in Friedrichshagen." }),
  ];
  const result = searchEntries(entries, "wasserrohr");
  assert.equal(result.length, 1, "should match ai_summary");
}

// searchEntries — case-insensitive, German locale
{
  const entries = [makeEntry({ id: "a", title: "Köpenick Stadtfest" })];
  const result = searchEntries(entries, "köpenick");
  assert.equal(result.length, 1, "should handle German umlauts");
}

// searchEntries — no match
{
  const entries = [makeEntry({ id: "a", title: "Testeintrag" })];
  const result = searchEntries(entries, "xyznotfound");
  assert.equal(result.length, 0, "no match should return empty array");
}

console.log("data smoke tests ok");
