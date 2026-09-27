# Design handoff and limits

The implementation follows the existing HTML and CSS source in `dist/`. The Material Designer
authoring and export tools were unavailable during this task, so no prototype, checked-in design
reference, or design-parity result is claimed.

Current design decisions are intentionally small: preserve the field guide's existing visual
language, place optional status reporting with the other Settings controls, keep its off state
visible, and disclose its data before the user enables it. A later design pass should use the
project's checked-in source as the baseline and include the browser and desktop surfaces.

The current changes have not received a new built-surface capture. Existing narrow captures are
historical and do not prove parity or layout behavior for this update.
