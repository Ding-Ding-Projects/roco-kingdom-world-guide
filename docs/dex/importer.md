# Importing and joining reference data

## BWiki creature list

`scripts/import_bwiki_dex.py` reads a locally saved HTML page and writes `dist/data/creatures.json`. It does not connect to the network. It scans the first table, keeps complete 22-column rows with numeric catalog numbers, extracts text and source links, and excludes portrait bytes.

```powershell
python scripts/import_bwiki_dex.py $env:TEMP\roco-dex-source.html dist/data/creatures.json --checked-on 2026-09-24 --community-updated-on 2026-09-13
```

The importer stops if its input cannot be read, the expected complete table is absent, or the source layout changes. Its totals count rows and distinct catalog numbers, not inferred species.

## Detailed community snapshot

`scripts/build_reference_snapshot.py` accepts a checked-out source tree and fixed snapshot metadata. It imports the upstream parser from `<source-root>/tools/pet_data.py`, then joins BWiki rows to handbook entries by catalog number and decoded source-page title. It writes:

- `dist/data/creature-details.json`: original catalog objects, skills, learnsets, handbook records and tasks, evolution paths, affinities, ecology, and skill-stone topics, keyed to the local form record IDs.
- `dist/data/type-chart.json`: the indexed matchup records.
- `dist/data/training-reference.json`: a separate historical S3 sample, loaded by the page only after the reader opens its disclosure.
- Added handbook area and habitat links in `dist/data/locations.json`.

Example:

```powershell
python scripts/build_reference_snapshot.py --source-root $env:TEMP\rocom-wiki-data --project-root . --source-commit 71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2 --source-version s4-2026-09-24 --source-updated-on "2026-09-24 15:55:24 UTC+8"
```

The current snapshot joins 625 form rows to 466 handbook entries. It contains 824 skills, 311 learnsets, 275 evolution groups, 2,342 handbook task topics, and 120 type combinations. This is a snapshot result, not a promise that all fields are current in-game.

## Refresh procedure and licensing

Pin the exact upstream revision before running the builder. Preserve the source version, timestamp, license, join method, and resulting counts. Review records with no exact match rather than guessing by a similar name. Refresh the source register, attribution note, article review dates, and this document together.

The community snapshot uses CC BY-NC-SA 4.0. Keep attribution, noncommercial use, and share-alike terms with redistributed derived data. Do not add portraits, map tiles, or unlicensed external marker files. See [DATA-LICENSE.md](../../DATA-LICENSE.md).
