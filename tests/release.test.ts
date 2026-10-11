import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { root, workspace } from './helpers.js';
import { dataDirectory, userDataDirectory } from '../packages/mcp-server/src/settings.js';

test('public manifests agree on release version and point to real entrypoints', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const file of ['plugin.json', '.codex-plugin/plugin.json']) assert.equal(JSON.parse(await readFile(path.join(root, file), 'utf8')).version, pkg.version);
  for (const file of ['mcp.json', '.mcp.json']) {
    const manifest = JSON.parse(await readFile(path.join(root, file), 'utf8'));
    assert.ok(manifest.mcpServers['codex-canvas']);
    assert.ok((await readFile(path.join(root, 'scripts/start-mcp.mjs'), 'utf8')).length);
    assert.ok(!/[A-Z]:[\\/]/.test(JSON.stringify(manifest)));
  }
});

test('portable installs keep their data outside replaceable version/cache directories', async t => {
  const { directory } = await workspace(t);
  await writeFile(path.join(directory, 'canvas-config.json'), JSON.stringify({ storage: 'user' }));
  const prior = process.env.CANVAS_DATA_DIR; delete process.env.CANVAS_DATA_DIR;
  try {
    assert.equal(await dataDirectory(directory), userDataDirectory());
    assert.equal(await dataDirectory(directory, path.join(directory, 'override')), path.join(directory, 'override'));
    assert.equal(userDataDirectory('linux', directory, { XDG_DATA_HOME: 'relative' }), path.join(directory, '.local/share/codex-canvas'));
    assert.equal(userDataDirectory('win32', directory, {}), path.join(directory, 'AppData/Local/CodexCanvas'));
  } finally { if (prior === undefined) delete process.env.CANVAS_DATA_DIR; else process.env.CANVAS_DATA_DIR = prior; }
});
