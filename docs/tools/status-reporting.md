# Optional desktop status reporting

## Availability and consent

Status reporting is a desktop-only, per-session option. It is off by default, is not remembered
between launches, and does not exist in the public browser edition. The control becomes
available only when the desktop process has its private Status Hub configuration. No status
request is made while the control is off or while configuration is missing.

## Data sent

After a user enables reporting, the desktop main process creates one session record containing
the project identifier, build source ref, machine label, and a local checkout inventory when
repository metadata is present. Each inventory entry can contain a path, ref, commit ID, dirty
state, and measured byte size. The session summary identifies that the field guide is open.
Searches, saved notes, bookmarks, and reading history are never read for reporting or included in
the payload. Packaged builds without repository metadata send no local checkout inventory.

The Status Hub client and ingest value stay in the desktop main process. A narrow preload bridge
exposes only status display and enable/disable calls. IPC messages are accepted only from the
local `roco://app/index.html` frame. The renderer receives a small state object and never sees
the ingest value, endpoint, session key, or raw transport error.

## Failure handling

- Missing configuration displays a configuration-required state and sends nothing.
- An unreachable service leaves the guide usable and marks the status surface unavailable.
- Disabling reporting attempts a final waiting update. If the service does not confirm it, the
  UI says that the last record may remain open.
- Closing the desktop companion attempts to finish the session before exit, subject to the
  client's bounded timeout.

## Verification state

The current checkout has no Status Hub configuration, so no live session was sent or verified.
The IPC route, opt-in UI, missing-configuration state, unreachable-service state, and orderly
shutdown still require interaction review in the built desktop companion. No search or local
user content is used as a status input.
