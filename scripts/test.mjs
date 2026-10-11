import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local', 'tests');
await mkdir(out, { recursive: true });
const names = ['runtime', 'transport', 'bridge', 'release', 'mcp'];
await build({ absWorkingDir: root, entryPoints: Object.fromEntries(names.map(name => [name, `tests/${name}.test.ts`])),
  outdir: out, outExtension: { '.js': '.mjs' }, bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external' });
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...names.map(name => path.join(out, `${name}.mjs`))], { cwd: root, stdio: 'inherit', windowsHide: true });
process.exitCode = result.status ?? 1;
