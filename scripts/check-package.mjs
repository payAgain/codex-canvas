import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = JSON.parse(await readFile(path.join(root, '.local/latest-release.json'), 'utf8'));
assert.equal(release.local, false, 'Only a portable package may pass the public release check.');
assert.ok(path.resolve(release.stage).startsWith(path.join(root, '.local', 'releases') + path.sep));
const config = JSON.parse(await readFile(path.join(release.stage, 'canvas-config.json'), 'utf8'));
assert.deepEqual(config, { storage: 'user' });
for (const name of ['mcp.json', '.mcp.json']) {
  const text = await readFile(path.join(release.stage, name), 'utf8');
  assert.ok(!text.includes(root) && !/[A-Z]:[\\/]/.test(text), 'Installation contains a local path.');
  const servers = JSON.parse(text).mcpServers;
  assert.deepEqual(Object.keys(servers), ['codex-canvas', 'codex-canvas-v0-3-1', 'codex-canvas-v0-4-0']);
}
for (const file of await readdir(release.stage, { recursive: true })) {
  assert.ok(!/(^|[\\/])(\.canvas-data|\.local|\.git|canvas-research-20261010|\.env)([\\/]|$)/.test(file), `Private data in package: ${file}`);
}
const installed = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: release.stage, shell: process.platform === 'win32', windowsHide: true, stdio: 'inherit' });
if (installed.status !== 0) throw new Error('Portable package dependency installation failed.');
const data = await mkdtemp(path.join(tmpdir(), 'codex-canvas-package-'));
const client = new Client({ name: 'canvas-package-check', version: release.version });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(release.stage, 'scripts/start-mcp.mjs'), '--data-dir', data], stderr: 'pipe' }));
  const list = await client.listTools(); assert.ok(list.tools.some(tool => tool.name === 'canvas_open_file'));
  const result = await client.callTool({ name: 'canvas_publish', arguments: { title: 'Portable package fixture', source: "import { Text } from '@codex-canvas/sdk'; export default function Canvas() { return <Text>Portable package works</Text>; }" } });
  assert.ok(!result.isError, JSON.stringify(result));
  assert.equal(result.structuredContent.ok, true, JSON.stringify(result.structuredContent.diagnostics));
  assert.equal(result.structuredContent.runtimeVersion, release.version);
  console.log(`Portable ${release.version}: locked dependency install, stdio startup, tools and real TSX compilation passed (${process.platform}/${process.arch}).`);
} finally {
  await client.close(); await rm(data, { recursive: true, force: true });
}
