# Changelog

## Unreleased

- Broaden Canvas Skill discovery to visual explanations without an explicit plugin request. Add proactive-use criteria, examples and text-only/simple-answer boundaries, and explicitly allow implicit invocation.
- Align plugin descriptions, MCP initialization guidance and the publish tool description with proactive visual answers. Keep native delivery and local-only filters/selections.

## 1.1.1 — 2026-10-11

First downloadable GitHub Release. Includes the earlier local Canvas features described below.

- Require native Codex Canvas MCP App delivery in the Canvas Skill, server initialization instructions and tool descriptions; stop native opening failures instead of launching a browser fallback.
- Remove the HTTP listener and browser preview URL from stdio plugin processes. Native tool results explicitly declare their presentation mode.
- Require `--browser` for standalone CLI previews and `--serve` for standalone HTTP servers.
- Explain disabled chat actions separately for browser mode and native hosts without the required capabilities.
- Add an explicit close button and Escape action to the canvas library drawer.
- Add permanent deletion for already-deleted canvases, with exact-title confirmation and server-side revision/deletion-state checks. Preserve external source files and legacy migration backups.
- Fix CI's stale hardcoded UI version assertion and update the storage regression for the current default. Isolate migration checks from the real user library and verify permanent deletion in temporary data.
- Include six software development diagrams, a runtime-boundary architecture example and bilingual showcase documentation.
- Publish a portable marketplace ZIP, SHA-256 checksums and bilingual installation notes. Add tag-triggered releases gated on cross-platform checks, and verify archives in normal CI.

## 1.1.0 — 2026-10-11 (local development)

- Store the default library under the Codex plugin directory, migrate legacy persistent data once, and retain the original library.
- Make Open file browse the default directory first, with source paths, folder reveal and restore-and-open actions for deleted canvases.
- Add Bright, Paper, Mist, Graphite and Midnight themes alongside Follow host; persist preferences and apply them to both the shell and renderer.
- Adapt cached successful canvases to the new theme renderer without changing source or published revisions; retain the old build on adaptation errors.
- Build only for this iteration; no test suite was added or run. Cross-platform and native upgrade observations remain open.

## 1.0.0 — 2026-10-10

First public release prepared for GitHub.

- Native Codex MCP App panel with TSX/JSX import, a canvas library and browser fallback.
- Isolated React rendering, persistent state, source history and last-successful-build recovery.
- Design mode: select an element, include versioned context, and explicitly request a targeted edit when supported by the host.
- Recoverable canvas deletion, without deleting external source files.
- Stable MCP server identity with compatibility entries for previously installed 0.3.1/0.4.0 cards; expired native sessions reconnect.
- Fix failed reads changing the active binding and overlapping navigation requests completing out of order.
- Clear stale selection requests and source-editor state when switching canvases.
- Correct the deleted-library count and skip theme rerenders when no successful build exists.
- Portable release layout with a per-user data directory and a locked runtime dependency tree.
- Regression tests, CI, distribution checks, MIT license and public repository documentation.
- Bilingual showcase README with architecture and edit-flow diagrams; six runnable examples covering reports, architecture, comparisons, timelines, charts and reviews.

Host message/file-entrypoint capabilities depend on the installed Codex version. See the release evidence for observed behavior and remaining limitations.

## 0.4.1 — 2026-10-10

- Preserve historical MCP server/resource identities and renew expired native sessions.

## 0.4.0 — 2026-10-10

- Native panel preference, Design mode and recoverable deletion.

## 0.1.0–0.3.1 — 2026-10-10

- Local renderer, publishing, state persistence, file watching and compact Canvas styling.
- Early installation and embedding fixes; detailed historical observations remain in `docs/compatibility/`.
