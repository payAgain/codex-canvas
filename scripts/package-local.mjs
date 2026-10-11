import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { runtimePackage } from './release-config.mjs';

// Deliberately stage an allowlist. Never copy workspace data, research checkouts,
// repository metadata, logs, credentials, or the developer's node_modules tree.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const renderer = JSON.parse(await readFile(path.join(root, 'packages/renderer/package.json'), 'utf8'));
const local = process.argv.includes('--local');
const runtime = runtimePackage(pkg, renderer);
const lock = JSON.parse(await readFile(path.join(root, 'release/package-lock.json'), 'utf8'));
const locked = lock.packages[''].dependencies;
if (lock.version !== pkg.version || Object.keys(locked).length !== Object.keys(runtime.dependencies).length || Object.entries(runtime.dependencies).some(([name, version]) => locked[name] !== version)) throw new Error('Release lock is stale. Run pnpm release:lock.');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const releaseRoot = path.join(root, '.local', 'releases', `${pkg.version}-${local ? 'local' : 'portable'}-${stamp}`);
const stage = path.join(releaseRoot, 'plugins', 'codex-canvas');
await mkdir(stage, { recursive: true });
for (const item of ['dist', 'packages', 'skills', 'examples', 'scripts', 'docs', 'plugin.json', '.codex-plugin', 'mcp.json', '.mcp.json', 'README.md', 'README.en.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'tsconfig.json', 'tsconfig.base.json']) {
  await cp(path.join(root, item), path.join(stage, item), {
    recursive: true,
    filter: name => !path.relative(root, name).split(path.sep).some(part => ['node_modules', '.canvas-data', '.local'].includes(part)),
  });
}
await writeFile(path.join(stage, 'package.json'), JSON.stringify(runtime, null, 2) + '\n');
await writeFile(path.join(stage, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
// Portable installs use a persistent per-user library outside plugin caches.
// The explicitly local package preserves this developer's existing library.
for (const file of ['mcp.json', '.mcp.json']) {
  const config = JSON.parse(await readFile(path.join(stage, file), 'utf8'));
  const server = config.mcpServers['codex-canvas'];
  server.command = 'node';
  if (local) server.env = { CANVAS_DATA_DIR: path.join(root, '.canvas-data') };
  else delete server.env;
  // Saved tool cards retain the server identity. Version the UI resource, not
  // the primary server name. Preserve the two identities already shipped.
  config.mcpServers = { 'codex-canvas': server };
  for (const name of ['codex-canvas-v0-3-1', 'codex-canvas-v0-4-0']) {
    config.mcpServers[name] = { ...server, args: [...server.args, '--compat'] };
  }
  await writeFile(path.join(stage, file), JSON.stringify(config, null, 2));
}
await writeFile(path.join(stage, 'canvas-config.json'), JSON.stringify(local ? { dataDirectory: path.join(root, '.canvas-data') } : { storage: 'user' }, null, 2));
const manifest = JSON.parse(await readFile(path.join(stage, 'plugin.json'), 'utf8'));
manifest.extensions = { 'com.openai': { interface: { displayName: 'Codex Canvas', shortDescription: '本地 React 画布、报告与持续编辑' } } };
await writeFile(path.join(stage, 'plugin.json'), JSON.stringify(manifest, null, 2));
await mkdir(path.join(releaseRoot, '.agents', 'plugins'), { recursive: true });
await writeFile(path.join(releaseRoot, '.agents/plugins/marketplace.json'), JSON.stringify({
  name: 'codex-canvas-local', interface: { displayName: 'Canvas 本地插件' },
  plugins: [{ name: 'codex-canvas', source: { source: 'local', path: './plugins/codex-canvas' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }],
}, null, 2));
await writeFile(path.join(releaseRoot, 'INSTALL.md'), `# Codex Canvas ${pkg.version}\n\nRequires Node.js 22+ and Codex with plugin support.\n\n1. Open a terminal in plugins/codex-canvas.\n2. Run: npm ci --omit=dev --ignore-scripts --no-audit --no-fund\n3. Return to this marketplace root and run: codex plugin marketplace add . --json\n4. Run: codex plugin add codex-canvas@codex-canvas-local --json\n5. Reload the plugin or restart Codex if the current chat still uses an older service.\n\nIf a marketplace named codex-canvas-local already points elsewhere, inspect it with codex plugin marketplace list --json, remove the old registration, then add this directory. Keep this extracted directory available for future installs.\n\n${local ? 'LOCAL BUILD: contains a machine-specific data path; do not publish.' : 'Portable build: canvases are stored in your user data directory, outside this installation.'}\n\nSee [usage](plugins/codex-canvas/docs/QUICKSTART.md), [release evidence](plugins/codex-canvas/docs/releases/1.0.0.md), and [MIT license](plugins/codex-canvas/LICENSE).\n`);
const release = { id: randomUUID(), version: pkg.version, local, platform: process.platform, arch: process.arch, releaseRoot, stage, node: process.execPath, ...(local ? { dataRoot: path.join(root, '.canvas-data') } : {}) };
await writeFile(path.join(releaseRoot, 'release.json'), JSON.stringify(release, null, 2));
await writeFile(path.join(root, '.local', 'latest-release.json'), JSON.stringify(release, null, 2));
console.log(JSON.stringify(release, null, 2));
