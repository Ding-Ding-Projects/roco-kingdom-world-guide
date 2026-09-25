# Data attribution and reuse

This project combines original writing and code with community-derived data. Each data group keeps its source, date, and license visible. A license for one source does not grant rights to another source's artwork or files.

## Creature and form list

The text fields in `dist/data/creatures.json` are derived from the [BWiki creature list](https://wiki.biligame.com/nrc/%E7%B2%BE%E7%81%B5%E5%88%97%E8%A1%A8). The saved page reviewed for this edition displayed a 2026-09-13 update date. It identifies CC BY-NC-SA 4.0 terms. This edition reviews and parses the source as text, retains its source links, records review dates, and excludes portraits and other artwork.

## Joined community snapshot

The detailed reference data is derived from [JayeGT002/rocom-wiki-data](https://github.com/JayeGT002/rocom-wiki-data), pinned to commit `71eba6e4cd5e0f01a5cda60ec5560f58aae2a1c2`, version `s4-2026-09-24`, published 2026-09-24 15:55:24 UTC+8. The upstream project identifies CC BY-NC-SA 4.0 terms and warns that its data can lag the game client.

This project transforms the reference by joining exact source-page titles and catalog numbers to local form record IDs. It writes separate files for creature details, type matchups, and the historical training sample. It keeps the pinned source metadata and license with the resulting files. The current joined edition contains 466 handbook entries, 2,342 handbook task topics, 824 skills, 311 learnsets, 275 evolution groups, and 120 type combinations.

The historical training sample is from Season 3, titled 铅字幻梦. Its counts are community submissions, not official recommendations, rankings, or win rates. It loads on request and is not presented as current advice.

## Community map labels

The 43 original Chinese labels in `dist/data/locations.json` are transcribed from the [BiliWiki S3 map index](https://wiki.biligame.com/rocom/%E5%A4%A7%E5%9C%B0%E5%9B%BE), which identifies CC BY-NC-SA 4.0 terms. This edition includes labels only. It does not include coordinates, point records, tiles, polygons, route lines, or map artwork.

The same data file now links habitat phrases and handbook-area names from the separate pinned community snapshot. Those linked records retain that snapshot's attribution and license independently of the map-label license.

## External interactive map

The [Roco Kingdom World interactive map](https://rocokingdomworld.org/maps/) is linked as an external reference. Its displayed marker count is attributed to that viewer and dated when cited. A reuse license for its marker set was not identified, so this project does not redistribute its coordinates, tiles, artwork, or data files.

## Original material

Unless a file says otherwise, original code and written guide prose are available under the MIT License in [LICENSE](LICENSE). The MIT License does not override CC BY-NC-SA terms for community-derived data.
