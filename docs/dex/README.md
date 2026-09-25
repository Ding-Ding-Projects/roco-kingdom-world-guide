# Creature Dex

The Dex is a searchable, community-derived form index. It currently joins 625 saved BWiki form rows to 466 catalog numbers. A row identifies one source-list form; it does not claim one unique base creature.

## Features

- Search names, catalog numbers, form labels, descriptions, traits, types, linked skills, handbook tasks, habitat notes, and evolution conditions. The search accepts literal text or the built-in pattern builder.
- Filter by listed type and form, and sort by catalog number, name, or listed base-stat total.
- Open each row for listed stats and source fields, then expand the joined skill, evolution, habitat, affinity, ecology, task, matchup, and historical sample sections.
- Save records locally in the current browser. Export filtered records or an individual record as JSON, CSV, or Markdown.

## Data groups

The detailed snapshot adds 466 handbook entries, 2,342 task topics, 824 skill records, 311 learnsets, 275 evolution groups, and skill-stone topic links. It is pinned to commit `71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2`, version `s4-2026-09-24`. Exact key joins retain the local form record ID. Rows with no exact match are not filled by name guesses.

- [Record fields and provenance](records.md)
- [Skills and evolution paths](skills-and-evolution.md)
- [BWiki importer and reference snapshot builder](importer.md)
- [Data attribution](../../DATA-LICENSE.md)

## Limits

Community data can lag the live client. A missing field means this edition's sources did not document it. It does not prove the game has no value for that field. Creature artwork is not included. Training counts are historical S3 community submissions, not official recommendations.
