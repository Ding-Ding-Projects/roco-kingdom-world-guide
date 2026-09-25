# Creature record fields and provenance

## One form row at a time

The base list stores one record per saved source row. A repeated catalog number can represent another listed form. The number identifies a family in this edition; `recordId` identifies the individual local row. The saved list contains 625 rows and 466 distinct catalog numbers. Neither count is presented as the live game's official roster total.

## Fields on each record

The original list fields include name, catalog number, form, type, trait, trait effect, evolution stage, season label, egg group, height, weight, rideability, co-riding, source description, six listed stats and their total, plus source URLs and review dates. The detail drawer exposes the full original catalog object as formatted JSON as well as the readable field grid.

Joined details appear when an exact form key links to a record in the pinned snapshot:

- Handbook title, habitat text, index areas, task prompts, targets, and listed rewards.
- Feature, native, bloodline, and skill-stone skills with available names, types, categories, energy costs, and descriptions.
- Evolution chains, level and type fields, condition text, leader branches, and named items where present.
- Affinity, ecology, fruit notes, and exact-key type matchups where supplied.
- A collapsed historical S3 training sample that loads only when requested.

## Freshness and missing values

The BWiki list was reviewed on 2026-09-24 and displayed a 2026-09-13 update date. The added community snapshot is pinned to commit `71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2`, version `s4-2026-09-24`, published 2026-09-24 15:55:24 UTC+8. The upstream maintainer warns the data can lag the client. Each record links to the list page and the joined snapshot revision.

An empty or unavailable field means the referenced data did not supply that value. It is not evidence of absence in the game. Current unlock requirements, timing, catch rates, battle exceptions, and other patch-sensitive rules must be checked in the current client.

## Search, settings, and exports

Search covers original catalog text and joined descriptions, tasks, skill text, habitat labels, and evolution conditions. Filters remain type and form. Pattern search rejects selected high-cost constructs and searches long records in overlapping text windows. Settings, saved rows, and history stay in the current browser. JSON, CSV, and Markdown exports identify the data source and license context. Markdown exports include source URLs and links to related guide articles. The detail drawer labels joined fields by their source snapshot and review date.

## Failure modes and data handling

- An invalid pattern shows an inline notice and produces no matches.
- The pattern editor limits input length and rejects lookarounds, backreferences, and selected nested unbounded quantifiers.
- CSV cells quote commas and double embedded quotation marks.
- Community-supplied text is inserted as text, not interpreted as markup.
- Portrait bytes and map imagery are excluded.
- Historical training values are not current win rates or ranking advice.

See [data attribution](../../DATA-LICENSE.md) for terms and modifications.
