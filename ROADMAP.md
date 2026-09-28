# Roadmap

## First public edition

- [x] Import the reviewed BWiki creature list with row and catalog-number counts.
- [x] Pin and join the dated community handbook, habitat, skill, evolution, ecology, type, and historical training snapshot to exact local form records.
- [x] Add a searchable matchup table and expandable Dex detail groups with per-source provenance.
- [x] Replace the decorative map schematic with honest marker, habitat, and handbook-area indexes linked to Dex records.
- [x] Add five bilingual articles for Dex fields, skills and evolution, type matchups, habitat lookup, and historical training data.
- [ ] Complete English, Cantonese, and bilingual UI review on the built page.
- [x] Run JavaScript syntax validation and parse all seven data JSON files after the final edits; verify the article and map counts and balanced stylesheet braces.
- [x] Scan all 36 text files for publication safety; review source game-text and required markup-attribute matches in context.
- [x] Register the public hosting project, preserve its source ID, and set its audience to public.
- [x] Push the exact source, save version 1, and deploy the static build publicly.
- [x] Verify the production address and all eleven required responses with unauthenticated GET requests; parse all seven JSON responses.
- [x] Capture and review the built page at 390×844 and 320×568 after the compact-header and search-hint adjustments. Both captures are English, light theme, and 100% scale; evidence and layout measurements are recorded under `evidence/responsive-header/`.
- [ ] Capture and review a desktop viewport and complete the supported language, theme, and display-scale matrix. The two narrow captures do not verify these states.
- [ ] Verify keyboard navigation and focus order through the built page; the current narrow captures record unnamed interactive controls but do not prove a keyboard path.
- [ ] Add a complete S4 coordinate atlas only when a reusable source provides verified geometry and access data.

## Ongoing upkeep

- [x] Publish version 3 from source commit `4fd2a35e94683079f98fec3cd7d99a9085615707` without changing the public audience; verify the production deployment and HTTP 200 responses for the page shell and four declared same-origin assets.
- [x] Inspect the deployed overview, Season 4 article, September event desk, and habitat/location article in the browser; confirm rendered counts, dated event caveats, and the absence of unsupported map coordinates.
- [x] Open one deployed Dex detail panel and confirm that the record exposes its source fields, stats, joined references, and provenance. This sample does not verify all 625 form rows.
- [x] Load the deployed Dex list through its final catalog entry and search for catalog 466; the summary reports 625 forms and the final record is reachable. The browser accessibility snapshot truncated its expanded row controls at 500.
- [ ] Recheck season, event, currency, academy, shop, encounter, and breeding facts after material updates.
- [ ] Complete a row-level reconciliation of the 625 saved local rows, 621 current BiliWiki results, and 644 Roco Kingdom World entries; do not infer missing records from index totals alone.
- [ ] Refresh the pinned community snapshot and re-review exact joins, license, missing fields, and source dates.
- [ ] Add personal vocabulary application only after authentication and the local-file contract can be implemented safely.

## GitHub Pages and desktop distribution

- [ ] Complete interaction and accessibility review of the desktop-only, explicit opt-in Status Hub surface. The implementation and feature article are in place; the current built surface has no capture or interaction evidence.
- [x] Build the Squirrel.Windows package from `main` source commit `6cc57241bb139e2dcbfc705171eb88ba4c0667ba`; workflow run `36380472795` succeeded. This verifies package creation, not installation or runtime behavior.
- [ ] Publish a unique non-draft desktop release with the installer, update package, and update manifest; verify every asset is downloadable.
- [x] Enable GitHub Pages with the Actions source, push the completed source to `main`, and verify the live page plus its required same-origin data and assets.
- [ ] Capture the current built page and desktop companion through the approved headless route. The route is unavailable in this session; the older narrow-view captures do not verify these changes.
- [ ] Complete keyboard, accessibility, language, theme, and supported-scale review on the current built surfaces.

## 2026-09-28 verified delivery

- [x] Deploy the guide from `main` source commit `6cc57241bb139e2dcbfc705171eb88ba4c0667ba`; Pages job `publish-pages` succeeded in [workflow run 36380472795](https://github.com/Ding-Ding-Projects/roco-kingdom-world-guide/actions/runs/36380472795).
- [x] Set the repository homepage to `https://ding-ding-projects.github.io/roco-kingdom-world-guide/` and verify the public address with unauthenticated HTTP requests.
- [x] Verify HTTP 200 responses for `/`, `/assets/app.js`, `/assets/site.css`, and all eight `/data/*.json` resources. These requests verify file delivery only.
- [x] Build the desktop package from the same source commit; `desktop-package` succeeded in workflow run `36380472795`. No installer launch, installation, or runtime verification is claimed.
- [ ] Review and verify the historical-capture gallery preserved on `codex/roco-public-gallery` at commit `9b93d9edb0541134e31ebd54ee1e2b9e6835cd6e`, then integrate and deploy it only after the current UI and content checks pass.
- [ ] Capture and inspect the current deployed UI through the approved headless route. The route is unavailable in this session; existing images are historical captures from source commit `bf90e1fd30e1bec271620479e03d95c353646633`.
- [ ] Complete keyboard and accessibility review and the supported language, theme, and scale matrix on the current built surfaces.
- [ ] Publish a unique non-draft desktop release with downloadable installer, update package, and update manifest.

## Historical 2026-09-27 delivery snapshot

The following unchecked items record the state on 2026-09-27 and are superseded where the 2026-09-28 verified delivery above says otherwise.

- [ ] Configure the repository's Pages source for the Actions deployment and publish the `dist/` edition to `https://ding-ding-projects.github.io/roco-kingdom-world-guide/`. The Pages API currently returns HTTP 404 and the repository homepage field is empty.
- [ ] Build a fresh Squirrel.Windows installer package from the final main source and verify its names, sizes, hashes, and source provenance. Earlier local output is stale diagnostic material.
- [ ] Publish a release only after its required reviewed image catalog is available; no qualifying tracked image catalog was found, so no release is claimed.
- [ ] Capture the current browser and desktop surfaces with the approved headless route. That route is unavailable in this session, so existing captures do not verify these changes.
- [ ] Finish current-source interaction, accessibility, language, theme, and supported-scale review. No tests were run for this task.
