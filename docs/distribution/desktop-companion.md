# Offline desktop companion

## Behavior

The Windows desktop companion packages the same `dist/` guide used by GitHub Pages. Its
`roco://app` protocol serves local files only, denies permission requests, disables renderer
Node.js access, and opens deliberate HTTPS links outside the companion. The guide, local JSON,
search, maps, articles, exports, and saved browser data remain available without a network
connection.

`build-installer.bat` resolves the pinned Node.js toolchain, installs the locked project packages,
and creates the Squirrel.Windows installer, full package, and `RELEASES` manifest under
`out/make/squirrel.windows/x64/`. The same files will be attached to a GitHub release so users can
download them without access to the Actions run. The application does not implement an in-app
update client; users obtain later versions from the release page.

## Privacy and security

The optional Status Hub control is visible in Settings only as a desktop capability. It starts
disabled on every launch. Enabling it requires a private `AGENT_INGEST_TOKEN` environment value
in the desktop process. The ingest value stays in the trusted main process and never enters the
page renderer or packaged source. Without that configuration, the companion reports that status
sharing is unavailable and sends nothing.

When enabled, the session record can include the project identifier, source ref, machine label,
and a local checkout inventory if repository metadata is present. It never includes search
terms, bookmarks, notes, or browsing history. The guide itself does not require network access.
Disabling the control sends a final waiting state. On exit, the companion attempts to finish the
session before quitting, with a bounded completion deadline.

The package is unsigned. Windows may show an unknown-publisher notice. No signature or trust
claim is made.

## Failure modes

- The first build needs access to the pinned Node.js archive and npm package registry. Later
  builds can reuse the verified local toolchain and installed packages.
- A digest mismatch, incomplete extraction, missing package, or failed Squirrel maker stops the
  build and must not be described as a completed installer.
- A missing Status Hub configuration keeps the control disabled. A network or service problem
  after explicit opt-in is shown as unavailable; it does not prevent guide use.
- If a final session update is not confirmed, the UI states that the last record may remain open.

## Verification

Build the package with the repository wrapper, then record its source revision, file names, byte
sizes, and SHA-256 values. Open the release asset links without authentication and verify that
each downloaded file matches the uploaded hash. This checks package delivery, not installation,
runtime behavior, update execution, or visual layout. No installer interaction or current UI
capture has been completed for this delivery task.
