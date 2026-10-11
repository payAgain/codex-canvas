# Contributing

Use Node.js 22+ and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm check
```

The regression suite uses temporary data directories. It must not read or modify the developer's canvas library. Changes to compiler, storage, transport or binding behavior should include a regression test that fails before the fix.

Keep renderer dependencies behind `packages/renderer`; generated canvases import `@codex-canvas/sdk`. Keep generated code inside the sandbox iframe. Host messages require an explicit user action. See [architecture](docs/ARCHITECTURE.md) and [project instructions](AGENTS.md).

For dependencies, update the workspace lock and then run `pnpm release:lock` to update the separate flattened runtime lock. Run `pnpm package:release` and `node scripts/check-package.mjs` before shipping a package. The release package must not contain machine-specific paths or user data.

Describe actual observations separately from automated checks. A mocked host response is not evidence that every Codex host supports that capability. Windows is the locally observed platform; the GitHub CI matrix checks Windows, Linux and macOS when run remotely.

Contributions are provided under the project's [MIT license](LICENSE). Keep third-party notices intact.
