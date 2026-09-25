# Local settings, search, and privacy

## Behavior and configuration

The static guide stores language mode, appearance, tabs, saved notes, read history,
notifications, and reminder settings in browser `localStorage`. Clearing site data or using
a different browser profile clears or separates those settings. Settings can be exported as
JSON; saved Dex results can be exported as JSON, CSV, or Markdown; the current article can be
exported as Markdown; the page can be printed.

Search has plain text and a bounded regular-expression builder. Pattern mode searches names
and titles rather than full article bodies. Patterns are limited to 100 characters and a
small set of constructs is blocked to reduce expensive searches. Search errors appear in the
current view.

The edition supports English, written Cantonese, and a combined reading mode. The English
and Cantonese playful-tone levels are stored separately. The appearance controls change
theme, text scale, density, corner shape, accent, and contrast. The site follows reduced
motion settings.

The local reminder runs only while this page remains open. It does not register a background
task or contact a notification service. The notice center, focus mask, and saved notes are
local presentation features.

## Personal vocabulary file

The file picker accepts a version 1 JSON object with an `entries` map and bounded entry sizes.
The file is parsed in memory. Only its validity and entry count are retained locally. It is
not applied to public page text, persisted, exported, logged, or sent to a server. This edition
has no authenticated area, so applying private replacement wording would violate the
unauthenticated-content boundary. Invalid, oversized, or unsupported files are declined.

## Features that do not apply to this edition

This site has no account, secret, credential, or private shared record. Credential editing,
account pairing, QR authenticators, recovery codes, and real access locks therefore do not
apply. The optional focus mask is cosmetic only and any visitor can clear it. It is not a
security control.

## Data and security considerations

There are no analytics, cookies for tracking, remote fonts, third-party scripts, or uploads.
Static JSON requests use the same origin with browser credentials omitted. The selected
vocabulary file is processed locally and discarded after its count is shown. Search terms
and exports remain on the user's device. The site is public; do not type passwords or secrets
into search, notes, or settings.

## Failure modes and recovery

- If browser storage is disabled or full, preferences may not survive a reload. Export saved
  notes before clearing browser data.
- If data files fail to load, the guide displays a local data error and offers direct JSON
  links.
- If a reminder is late because the page was closed, open the current game notice directly;
  no background reminder exists.
- Reset requires typing `RESET` and only clears browser-local guide settings.
