# Project handoff

## Objective

Deliver a public Roco Kingdom: World guide with a map index, practical articles, and a detailed searchable creature Dex.

## Current delivery state, 2026-09-28

- The live GitHub Pages address is <https://ding-ding-projects.github.io/roco-kingdom-world-guide/>. The repository homepage field points to this address.
- Source revision `6cc57241bb139e2dcbfc705171eb88ba4c0667ba` is on `main`. Workflow run [36380472795](https://github.com/Ding-Ding-Projects/roco-kingdom-world-guide/actions/runs/36380472795) completed successfully for both `publish-pages` and `desktop-package`.
- Unauthenticated requests to `/`, `/assets/app.js`, `/assets/site.css`, and all eight `/data/*.json` resources returned HTTP 200. This verifies file delivery only. It does not verify browser rendering or interaction.
- The workflow created the desktop Squirrel.Windows package from the same source revision. No desktop release has been published, and installation or runtime behavior has not been verified.
- The historical-capture gallery change is preserved on `codex/roco-public-gallery` at commit `9b93d9edb0541134e31ebd54ee1e2b9e6835cd6e`, based on the deployed `main` revision above. It carries two unchanged, visually reviewed historical images from source revision `bf90e1fd30e1bec271620479e03d95c353646633`. The gallery change has not been integrated, built, or deployed; its runtime behavior remains unverified. The 320 × 568 capture time is unavailable. The 390 × 844 capture time is `2026-09-25T06:00:25.889Z`.
- The UI repair change remains preserved on `codex/roco-ui-repairs` at commit `7467e61563cf20e567e97e29d166c8435592ad28`. It has not been integrated or verified.
- The approved headless capture route was unavailable. No current-source screenshot exists. Keyboard use, accessibility, desktop layout, and the complete language, theme, and scale matrix remain unverified. No test suite was run for this delivery follow-up.
- GitHub issue `#3` remains open because its completion comment requires a fresh capture of the current built surface. The capture route was unavailable, so no comment was added there.
- The Status Hub enrollment route was unavailable in this session. No live Status Hub record was created.
- This handoff update covers five documentation files: this file, `README.md`, `ROADMAP.md`, and the two distribution guides.
- During recovery, agent-created Discussion `#4` comment `18634439` was replaced in place after a public-language scan found an invalid term. The edited comment was read back at `2026-09-28T05:56:26Z`; a complete scan of the repository's two issues, their three comments, two Discussions with six comments, releases, and pull requests found no remaining vocabulary matches. The tracked-file and commit-message scan also found none.

## Implemented locally

- Added a bilingual roster comparison article and separately dated source records for the edition snapshot, the current BiliWiki result count, and the independent Roco Kingdom World index. The four local form keys `047-02`, `048-02`, `048-04`, and `162-02` remain in the data; unmatched identities are not presented as missing creatures.
- Updated the Dex and source desk to display the three counts with their snapshot dates and to link the article explaining why they cannot be treated as one official total.
- Added a pinned reference snapshot builder and generated detailed records for the local form index.
- The joined snapshot carries handbook entries and tasks, skill descriptions and learnsets, evolution chains and conditions, habitat phrases, affinity, ecology, type matchups, and a separate historical training sample.
- The Dex searches joined fields and provides expandable source details. JSON, CSV, and Markdown exports include joined data where applicable.
- Added a searchable 120-combination type table and an atlas with 43 S3 markers, 57 habitat labels, and three handbook areas linked to Dex rows.
- Expanded the original 15 English and written-Cantonese articles to 21.
- Added internal related-article links for source-method references and preserved those links in Markdown exports; the edition log retains the first-edition record and now documents the 21-article roster-comparison update.
- Updated feature documentation, source attribution, data license notes, roadmap, and this handoff.
- Removed unused social-preview metadata and its card asset. The project does not include game artwork or external map data.

## Data dates and limits

- The saved edition list contains 625 form rows across 466 catalog numbers, reviewed 2026-09-24. The current BiliWiki list displayed 621 results with a 2026-09-13 update date when checked 2026-09-25. The independent Roco Kingdom World index displayed 644 entries on 2026-09-25. The row-level mapping remains incomplete; these numbers do not prove that any one index is the official complete roster.
- Four local form keys, `047-02`, `048-02`, `048-04`, and `162-02`, remain visible. No exact identity mapping was established for every difference in the compared indexes.
- The detailed community snapshot is `JayeGT002/rocom-wiki-data` commit `71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2`, version `s4-2026-09-24`, published 2026-09-24 15:55:24 UTC+8. It contains 466 handbook entries, 2,342 task topics, 824 skills, 311 learnsets, 275 evolution groups, and 120 type combinations. Its data is CC BY-NC-SA 4.0 and may lag the live client.
- Habitat and location labels do not provide local coordinates, route geometry, unlock order, spawn rates, or a complete current-season atlas. The external map is linked because reuse terms for its marker set were not identified.
- The training sample is S3 community submission data and is not current official advice.

## Historical verification and publication state before 2026-09-28

- Public version 3 was saved from source commit `4fd2a35e94683079f98fec3cd7d99a9085615707` and deployed successfully at [Roco Kingdom: World Atlas & Dex](https://roco-kingdom-world-field-atlas.dewlook123.chatgpt.site). The public audience was left unchanged. The stored archive reports SHA-256 `sha256:8a8253957ed26f3c9c371950d41b946b7fe09e457c5869dc95cabe3993f6e663` and 5,304,320 bytes.
- The bundled Sites source workflow read the configured `main` ref back at `4fd2a35e94683079f98fec3cd7d99a9085615707`, matching the source revision used for version 3. The production deployment returned `succeeded` for version 3.
- An independent unauthenticated GET of `/` returned HTTP 200 with `text/html`, 9,665 bytes, and the title `Roco Kingdom: World Field Guide`. HEAD requests to `/assets/app.js`, `/assets/site.css`, `/assets/favicon.svg`, and `/cdn-cgi/challenge-platform/scripts/jsd/main.js` each returned HTTP 200. The response contained one inline SVG, no `<img>` elements, and no CSS image URL. This verifies the page shell and declared resource delivery; it does not verify script execution or the rendered current-season and article content.
- The deployed application was opened in a browser and its rendered text was reviewed on the overview, Season 4 article, September event desk, and habitat/location article. The overview shows 625 listed form rows across 466 catalog numbers, 120 type combinations, 21 articles, and 43 S3 marker labels plus 57 handbook habitat labels in the location summary. The September event desk is checked 2026-09-25 and states the Cocoa Festival maximum, the dated Flower Seed cycle with unverified next-cycle requirements, the Pika notice cutoff with no extracted time zone, and the unreadable September 24 patch detail. The location article states that source labels provide no coordinates or route geometry. This confirms client-rendered production text for those views only; it does not verify search results, every article, keyboard use, or other language, theme, and scale states.
- One production Dex record was opened and reviewed. Its detail panel exposes listed base stats, original source fields, handbook and habitat data, task references, skills, learnset, bloodline skills, skill stones, evolution paths, affinity, type matchups, the pinned source snapshot, and the missing-value and reuse notices. This proves the record layout and joined sections for one example, not field-level completeness for all 625 form rows.
- The production Dex list was advanced until its `Load more` control disappeared. The bottom of the rendered list showed catalog entries through 466, and searching for the final entry returned exactly one matching record; the summary still reported 625 forms. The accessibility snapshot supplied the first 500 row controls when expanded, so that truncated snapshot was not treated as proof that later records were absent.
- The September 25 source changes include the compact-header update at `528bdd1061c6a72e9fc4fea2dfcab279f1d7dc5e` and the shorter global search hint at `bf90e1fd30e1bec271620479e03d95c353646633`. Their exact source-bound narrow-view captures are recorded below. The deployed version 3 includes those changes plus the later documentation and evidence update at `4fd2a35e94683079f98fec3cd7d99a9085615707`.
- The current public-language scan covered 32 tracked files and eight recent commits, with zero matches. The local checkout has no configured `origin`, so visibility could not be determined and the scanner treated findings as leaks. Earlier broad source scans found only existing game-name and description text in generated data and the importer; no responsive-header evidence file had a match.
- No test suite was run for the latest source change. `git diff --check` reported no whitespace issue for the source commits. The fresh narrow review did not evaluate keyboard navigation, screen-reader behavior, desktop rendering, or the complete language, theme, and scale matrix.
- Historical version 1 baseline only: source SHA `ecfc27f8ca5182465df891a0f516278f9af9fb7f` was verified before saving. At that baseline, unauthenticated GET requests returned HTTP 200 for `/`, the public assets, and all seven `/data/*.json` files; every JSON response parsed successfully without credentials or cookies.

## Historical responsive header adjustment

- The compact-header CSS hides the repeated secondary wordmark up to 520 px, keeps the primary label on one line, and reduces the gaps around the brand and utility controls. The edition label remains in the context row. The global search placeholder is now shorter so it fits the narrow search field.
- The built page was captured and visually inspected at 320×568 and 390×844, English, light theme, and 100% scale. Both pages measured exact body widths of 320/320 and 390/390 with no horizontal overflow. The global search field measured 141/141 and 211/211 respectively. Both accessibility-tree summaries reported zero unnamed interactive controls. No keyboard path was verified.
- Genuine images, derived layout summaries, and public-safe provenance are stored under `evidence/responsive-header/`. The 320×568 screenshot SHA-256 is `88311a662122c6abf1402b9523b0f382263d050018e7fdac91e5c5058ccee771`; the 390×844 screenshot SHA-256 is `ee73bf0e3aa4a94d7402e5fdb99231bbf3fba5108cfa5e215b706a80455f7ef8`. Their exact source commit is `bf90e1fd30e1bec271620479e03d95c353646633`. Browser target receipts each showed one expected page and are represented by their hashes in `capture-provenance.json`; machine-local profile paths and process identifiers are not included in the checked-in evidence.
- The 320 screenshot's exact capture time was not recorded; the target receipt validates the capture date and UTC timezone. The 390 capture time was recorded as `2026-09-25T06:00:25.889Z`. Both captures exclude personal data and retain no page text in the metrics.
- Only these two narrow English, light-theme, 100%-scale tuples were reviewed. Desktop rendering, keyboard navigation, Cantonese and bilingual modes, dark theme, and the 125%, 150%, and 200% scales remain unverified. The full Material Design 3 matrix is incomplete. The preferred design flow was unavailable in this run, so the change follows the existing static HTML/CSS route.
- The first version 3 packaging attempt passed a native Windows drive path to Git Bash `tar`, which interpreted its colon as a remote-host separator. Retrying the bundled packager with a Git Bash path form produced a 915,193-byte archive from source revision `4fd2a35e94683079f98fec3cd7d99a9085615707`; the Sites version record separately reports its stored archive size and hash above.
- The public-language scan reviewed 22 authored Markdown files. Its only match is line 36 of `docs/current-season/season-4.md`, inside an unchanged creature name; that is an unrelated proper noun, not an assistant-model reference. None of the changed Markdown files produced a match.

## Remaining work

1. Capture a desktop viewport and verify keyboard navigation. Complete the full language, theme, and scale review; the two narrow English captures do not cover those states.
2. Add coordinates and route geometry only when a reusable source provides verified data and reuse terms.
3. Refresh time-sensitive season facts and the pinned community snapshot after material updates.

## Historical GitHub Pages and desktop companion task before 2026-09-28

The active delivery work is on `codex/roco-pages-guide`. The planned public address is
`https://ding-ding-projects.github.io/roco-kingdom-world-guide/`; the source workflow and
desktop Squirrel.Windows packaging are being added to the default-branch delivery path.
The offline companion serves the same `dist/` content through a restricted local protocol.
Its optional Status Hub integration is disabled until the user explicitly enables it and a
private ingest configuration is present. No token is embedded in the public build or exposed to
the page renderer. This checkout has no Status Hub configuration, so a live Hub record has not
been created.

The package and deployment work remain unverified until the final source is pushed to `main`,
GitHub Actions finishes, the public address serves the expected page and data, and the desktop
release assets are read back from GitHub. One local Squirrel build completed from the uncommitted
task source, but its generated provenance identifies baseline revision
`7d019d89e6c507261468c729c908b30c8dc14491` and `local-build`. It also predates the HTTPS lockfile
correction. Those files are diagnostic output only and will not be published. A fresh build must
run from the preserved final source. The Lowlevel headless capture route is unavailable in this
session, so the historic 320×568 and 390×844 captures are not evidence for the current changes.
Keyboard navigation, desktop layout,
accessibility, and the complete language, theme, and scale matrix remain open.

The Material Designer handoff is also unavailable in this session. The current HTML and CSS
design remains the implementation source; no design prototype or parity result is claimed.

The GitHub Pages and offline desktop delivery workflow is tracked in
[`docs/distribution/README.md`](docs/distribution/README.md). Status-sharing scope and failure
handling are in [`docs/tools/status-reporting.md`](docs/tools/status-reporting.md).

## Historical GitHub Pages and desktop companion update, 2026-09-27

The current delivery work is on `codex/roco-pages-guide` at baseline source SHA
`eaefae5715fc1a768b920c365037142ad21b9391`; the changes below are currently local and have no
new source SHA yet. The intended GitHub Pages address is
`https://ding-ding-projects.github.io/roco-kingdom-world-guide/`, but the repository has
`has_pages: false`, the Pages API returns HTTP 404, no deployment run exists, and the homepage
field is empty. The address is therefore planned, not live or verified.

The current source changes cover `.github/workflows/pages.yml`,
`desktop/status-hub-client/status-hub-client.mjs`, `dist/assets/app.js`,
`dist/data/articles.json`, `dist/data/sources.json`, `dist/index.html`, `README.md`,
`ROADMAP.md`, and the current-season and distribution articles. They pin the deployment actions,
keep a missing desktop upload visible as a failed run, require HTTPS outside strict loopback for
Status Hub connections, reject redirects on health and authenticated calls, render bilingual
strings with language spans and update the document language, and distinguish source-specific
review dates. The weekend and September 25 Flower Seed notices were rechecked on 2026-09-27;
the Cocoa preview was last read on 2026-09-26. Event time zones, shiny odds, and unreadable or
unstated reward details remain unknown.

No test suite or new capture was run for these changes. The static build and desktop package
have not yet been rebuilt from the final source. The cheap Lowlevel headless capture route and
Material Designer handoff were unavailable. The historical public Sites address returned a TLS
handshake error in the latest reachability probe, so its prior version-3 verification is not a
current reachability claim.

GitHub Pages setup and publication, current built-surface evidence, a fresh desktop package, and
release publication remain open. Release publication is additionally blocked by the required
reviewed image catalog not being present in the repository; no image will be invented. GitHub issue
`#3` remains open. The wiki setting is enabled, but its Git endpoint returned `Repository not found`.
The `gh` CLI has no wiki-content command, so no page was created. The Status Hub
configuration is absent, so the local scratchpad remains the only live status surface and is not
mobile-accessible.
