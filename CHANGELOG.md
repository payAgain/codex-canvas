# Changelog

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
