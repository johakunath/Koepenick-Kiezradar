# Design review — Köpenick Kiezradar

Branch: `codex/discovery-design`, stacked on `codex/discovery-foundation`.
Review date: 16 September 2026. No production deployment.

## Direction

Keep the existing Fraunces/Inter typography and water/nature character. The original Schloss/Reiher panorama now belongs to the desktop introduction and mobile footer rather than floating over results. Warm off-white surfaces, deep teal actions, restrained reed accents and more legible muted text give the existing identity clearer hierarchy.

## Changes to review

- A compact wordmark and navigation with an accessible theme toggle and skip link.
- One filter panel: search/location, time range, interests; advanced categories stay in a labelled disclosure.
- Date blocks, quieter tag chips, explicit selection and source links on cards. Repetitive fallback summaries are omitted from cards but remain on detail pages.
- Desktop list/map split with a sticky map. Mobile uses the same controls and a full-width map above results.
- Popups fit the actual map dimensions and pan into view; unchanged map bounds do not generate repeated state updates.
- Grouped detail facts, readable primary source actions, calmer empty/loading states, dark native controls and reduced-motion support.
- No new artwork, package, source, ranking rule or data migration in this design commit.

## Verification

| Check | Result |
|---|---|
| Default desktop viewport | Clear heading, filters and first results; original panorama retained |
| 390px mobile | No page-level horizontal overflow |
| 360px mobile, light and dark | Navigation, filters and dropdown fit; source/status text remains readable |
| Weekend → card → map → detail | Period and selected ID preserved in URLs |
| Family + Today with no matches | Honest empty state; reset returns to discovery |
| Ortsteil = Johannisthal | Results and map agree; dropdown stays inside viewport |
| Marker popup, 360px | Popup bounding rectangle fully inside map rectangle |
| Area search / show all | Applies current map area, restores filtered results |
| TypeScript and production build | Passed; Google Fonts access required |

Nearby distance/filter logic is covered by unit tests; real browser location permission was not granted. Offline tile failure and a full assistive-technology audit were not simulated. This is browser-based desktop/mobile viewport QA, not testing on physical phones.

## Review separately

The functional branch works on its own. Deploy it first if you want the data and interaction improvements with the previous global visual theme. Review `git diff codex/discovery-foundation..codex/discovery-design` to see only the visual changes and map-presentation refinements.

The optional admin web trigger requires new production environment configuration described in `docs/discovery-review.md`; normal GitHub Actions ingestion does not.
