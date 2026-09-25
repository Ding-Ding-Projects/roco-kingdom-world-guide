# Project handoff

## Objective

Deliver a public Roco Kingdom: World guide with a map index, practical articles, and a detailed searchable creature Dex.

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

## Verification and publication state

- Public version 2 was saved from source commit `9bab3d7fcd51de0d5821bd463686a3bb0ba33fa3` and deployed successfully at [Roco Kingdom: World Atlas & Dex](https://roco-kingdom-world-field-atlas.dewlook123.chatgpt.site). The earlier version 1 deployment was the original public baseline. Its earlier checks do not cover later source changes.
- Before the compact-header change in this continuation, the configured `main` ref was verified at `c349bf8dbc694ac77eda5a5e62652bfc4460a1fe` when the bundled Sites workflow reopened the existing checkout. That commit contains the September 25 Flower Seed article and source updates.
- The current local `main` revision is `bf90e1fd30e1bec271620479e03d95c353646633`, following compact-header commit `528bdd1061c6a72e9fc4fea2dfcab279f1d7dc5e`. It shortens the global search placeholder after the first 390 px and 320 px renders showed that hint running out of room. This revision is not yet uploaded to the Sites source, saved as a new version, or deployed. Public version 2 remains the latest verified deployment.
- The public-language scan checked 39 tracked and new files. The only four hits are in unchanged `dist/data/creature-details.json`, `dist/data/creatures.json`, `dist/data/training-reference.json`, and `scripts/import_bwiki_details.py`; they are existing game-name/description text and the required HTML data attribute. No changed file had a hit.
- No test suite was run for the latest source change. `git diff --check` reported no whitespace issue for the source commits. The fresh narrow review did not evaluate keyboard navigation, screen-reader behavior, desktop rendering, or the complete language, theme, and scale matrix.
- Historical version 1 baseline only: source SHA `ecfc27f8ca5182465df891a0f516278f9af9fb7f` was verified before saving. At that baseline, unauthenticated GET requests returned HTTP 200 for `/`, the public assets, and all seven `/data/*.json` files; every JSON response parsed successfully without credentials or cookies.

## Current responsive header adjustment

- The compact-header CSS hides the repeated secondary wordmark up to 520 px, keeps the primary label on one line, and reduces the gaps around the brand and utility controls. The edition label remains in the context row. The global search placeholder is now shorter so it fits the narrow search field.
- The built page was captured and visually inspected at 320×568 and 390×844, English, light theme, and 100% scale. Both pages measured exact body widths of 320/320 and 390/390 with no horizontal overflow. The global search field measured 141/141 and 211/211 respectively. Both accessibility-tree summaries reported zero unnamed interactive controls. No keyboard path was verified.
- Genuine images, derived layout summaries, and public-safe provenance are stored under `evidence/responsive-header/`. The 320×568 screenshot SHA-256 is `88311a662122c6abf1402b9523b0f382263d050018e7fdac91e5c5058ccee771`; the 390×844 screenshot SHA-256 is `ee73bf0e3aa4a94d7402e5fdb99231bbf3fba5108cfa5e215b706a80455f7ef8`. Their exact source commit is `bf90e1fd30e1bec271620479e03d95c353646633`. Browser target receipts each showed one expected page and are represented by their hashes in `capture-provenance.json`; machine-local profile paths and process identifiers are not included in the checked-in evidence.
- The 320 screenshot's exact capture time was not recorded; the target receipt validates the capture date and UTC timezone. The 390 capture time was recorded as `2026-09-25T06:00:25.889Z`. Both captures exclude personal data and retain no page text in the metrics.
- Only these two narrow English, light-theme, 100%-scale tuples were reviewed. Desktop rendering, keyboard navigation, Cantonese and bilingual modes, dark theme, and the 125%, 150%, and 200% scales remain unverified. The full Material Design 3 matrix is incomplete. The preferred design flow was unavailable in this run, so the change follows the existing static HTML/CSS route.
- The Sites package wrapper selected a WSL Bash launcher that could not start `/bin/bash`. Calling the bundled `package-site.sh` through Git Bash produced a valid archive for the earlier `c349bf8dbc694ac77eda5a5e62652bfc4460a1fe` source, but that archive predates this CSS adjustment and must not be reused. Regenerate the archive from the final pushed source before saving a new version.
- The public-language scan reviewed 22 authored Markdown files. Its only match is line 36 of `docs/current-season/season-4.md`, inside an unchanged creature name; that is an unrelated proper noun, not an assistant-model reference. None of the changed Markdown files produced a match.

## Remaining work

1. Push the current source revision to the configured Sites source, regenerate its archive, save the next version, and deploy it without changing its public audience. Prove the deployed version contains the exact final source commit.
2. Capture a desktop viewport and verify keyboard navigation. Complete the full language, theme, and scale review; the two narrow English captures do not cover those states.
3. Add coordinates and route geometry only when a reusable source provides verified data and reuse terms.
4. Refresh time-sensitive season facts and the pinned community snapshot after material updates.
