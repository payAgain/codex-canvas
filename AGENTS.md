# Project instructions

## Start here

- Read `README.md`, `docs/ROADMAP.md`, and the task document for the active milestone.
- This project develops a Codex desktop Canvas plugin in an independent repository.
- Root instructions apply to this project. Research checkout instructions apply only inside their own checkouts.

## Architecture

- Generated canvas files use this project's SDK. Keep third-party renderer APIs behind `packages/renderer`.
- Keep MCP transport, host integration, browser rendering, and filesystem storage separate.
- Follow the dependency boundaries in `docs/ARCHITECTURE.md`.
- Prefer a pinned library dependency. Maintain a separate renderer fork only when changes require it.
- Research checkouts under `canvas-research-20261010/` are reference material, not workspace packages or application dependencies.

## Evidence and status

- Current desktop UI and message capabilities are unverified. Start functional development with P0.
- Distinguish documented interfaces, observed host behavior, and proposed designs.
- Record capability failures as evidence; do not assume every MCP Apps host implements OpenAI extensions.
- Do not mark a milestone complete without its stated evidence.
- Do not add or run tests unless the user requests testing or verification.

## Runtime and user actions

- Generated code executes in an isolated browser context, never in the Node service.
- Keep generated code separate from the trusted MCP App shell and host bridge.
- Use explicit artifact identities and server-controlled bindings. Do not infer desktop conversation IDs.
- Send edit requests only from clear user actions; filters and local controls do not start Agent turns.
- Preserve the latest successful render when a new compilation fails.

## Changes

- Keep the roadmap and task statuses consistent with implemented work.
- Preserve upstream notices when reusing third-party code.
- Use relative links and paths in repository documentation and provenance.
- Installable plugin manifests must reference existing entry points. Planning files are not installable plugins.
