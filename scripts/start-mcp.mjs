import { existsSync } from 'node:fs';
const entry = new URL('../dist/server.mjs', import.meta.url);
if (!existsSync(entry)) {
  console.error('Codex Canvas is not built. Run pnpm install --frozen-lockfile and pnpm build in the plugin directory.');
  process.exit(1);
}
process.argv.push('--stdio');
await import(entry.href);
