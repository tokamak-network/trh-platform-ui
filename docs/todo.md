# TODO

## Task

- [x] Review `docs/PRESET_IMPLEMENTATION_KOR.md` and compare it with the current codebase structure.
- [x] Create an English translation as `docs/PRESET_IMPLEMENTATION_EN.md`.
- [x] Evaluate whether the English document is sufficient for a Codex agent to implement and test the feature end to end.
- [x] Rewrite the Korean document so it is implementation-ready and test-ready.
- [x] Update `docs/lessons.md` with documentation lessons from this task.
- [x] Run verification on the changed documents.

## Review

- Added a source-faithful English translation with explicit markers where the original text is corrupted.
- Rewrote the Korean document into an execution-ready implementation spec aligned to the current App Router and feature-slice architecture.
- Verified document consistency with `git diff` and repository health with `npm run lint` (passed with pre-existing warnings only).
