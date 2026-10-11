import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typecheck = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--noEmit'], { cwd: root, stdio: 'inherit' });
if (typecheck.status !== 0) process.exit(typecheck.status ?? 1);
await mkdir(path.join(root, 'dist'), { recursive: true });
await build({ absWorkingDir: root, entryPoints: { server: 'packages/mcp-server/src/index.ts', cli: 'packages/mcp-server/src/cli.ts' }, outdir: 'dist', outExtension: { '.js': '.mjs' }, bundle: true, platform: 'node', format: 'esm', target: 'node22', packages: 'external', sourcemap: true });
const design = await build({ absWorkingDir: root, entryPoints: ['packages/renderer/src/design-mode.ts'], bundle: true, write: false, platform: 'browser', format: 'iife', target: 'es2022', minify: true });
const ui = await build({ absWorkingDir: root, entryPoints: ['packages/mcp-server/src/ui/shell.ts'], bundle: true, write: false, outdir: 'dist/ui', platform: 'browser', format: 'iife', target: 'es2022', minify: true,
  define: { __CANVAS_DESIGN_SCRIPT__: JSON.stringify(design.outputFiles[0].text) } });
const js = ui.outputFiles.find(f => f.path.endsWith('.js')).text.replaceAll('</script', '<\\/script');
const css = ui.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? '';
const template = await readFile(path.join(root, 'packages/mcp-server/src/ui/shell.html'), 'utf8');
await writeFile(path.join(root, 'dist/app.html'), template.replace('/* SHELL_CSS */', () => css).replace('/* SHELL_JS */', () => js));
console.log('Built dist/server.mjs, dist/cli.mjs and dist/app.html');
