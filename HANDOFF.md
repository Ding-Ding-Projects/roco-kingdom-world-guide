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

- The roster comparison update is source commit `9bab3d7fcd51de0d5821bd463686a3bb0ba33fa3`. `node --check dist/assets/app.js` passed; all seven `dist/data/*.json` files parse; the current dataset has 21 articles and 20 source records; `git diff --check` passed with only line-ending notices.
- At publication time, the configured source repository's `main` ref was verified at that commit with `git ls-remote`.
- The public Site saved version 2 from that source commit and deployed successfully at [Roco Kingdom: World Atlas & Dex](https://roco-kingdom-world-field-atlas.dewlook123.chatgpt.site). The earlier version 1 deployment was the original public baseline.
- The public-language scan checked 39 tracked and new files. The only four hits are in unchanged `dist/data/creature-details.json`, `dist/data/creatures.json`, `dist/data/training-reference.json`, and `scripts/import_bwiki_details.py`; they are existing game-name/description text and the required HTML data attribute. No changed file had a hit.
- No test suite was run. No new rendered-page, keyboard, screen-reader, or narrow-viewport review was completed. The available capture route was unavailable, so no current screenshot is claimed.
- Historical version 1 baseline only: source SHA `ecfc27f8ca5182465df891a0f516278f9af9fb7f` was verified before saving. At that baseline, unauthenticated GET requests returned HTTP 200 for `/`, the public assets, and all seven `/data/*.json` files; every JSON response parsed successfully without credentials or cookies.

## Remaining work

1. Review the rendered page, keyboard behavior, and narrow viewport when the approved headless capture route is available. No substitute capture is claimed.
2. Add coordinates and route geometry only when a reusable source provides verified data and reuse terms.
3. Refresh time-sensitive season facts and the pinned community snapshot after material updates.
