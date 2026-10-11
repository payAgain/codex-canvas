import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, access, rename } from 'node:fs/promises';
import path from 'node:path';
import { root, workspace } from './helpers.js';
import { dataDirectory, userDataDirectory, pluginDataDirectory } from '../packages/mcp-server/src/settings.js';

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
  await writeFile(path.join(directory, 'canvas-config.json'), JSON.stringify({ storage: 'plugin' }));
  const location = { platform: process.platform, home: directory, env: {} };
  assert.equal(await dataDirectory(directory, undefined, location), pluginDataDirectory(directory, {}));
  assert.equal(await dataDirectory(directory, path.join(directory, 'override'), location), path.join(directory, 'override'));
  assert.equal(userDataDirectory('linux', directory, { XDG_DATA_HOME: 'relative' }), path.join(directory, '.local/share/codex-canvas'));
  assert.equal(userDataDirectory('win32', directory, {}), path.join(directory, 'AppData/Local/CodexCanvas'));
  const custom = { ...location, env: { CODEX_HOME: path.join(directory, 'custom-codex'), CANVAS_DATA_DIR: path.join(directory, 'env-data') } };
  assert.equal(pluginDataDirectory(custom.home, custom.env), path.join(directory, 'custom-codex/plugins/codex-canvas/data'));
  assert.equal(await dataDirectory(directory, undefined, custom), custom.env.CANVAS_DATA_DIR);
  assert.equal(await dataDirectory(directory, path.join(directory, 'explicit'), custom), path.join(directory, 'explicit'));
});

test('library migration preserves identity, deleted history and preferences without copying live server credentials', async t => {
  const { store, directory } = await workspace(t);
  await store.setTheme('paper');
  const id = (await store.publish('Migration fixture', "export default function Canvas() { return <p>Saved</p>; }")).manifest.canvasId;
  await store.setDeleted(id, 1, true);
  await writeFile(path.join(store.dataRoot, 'preview-1.1.0.json'), JSON.stringify({ uiSession: 'obsolete-session' }));
  const location = { platform: process.platform, home: directory, env: { CODEX_HOME: path.join(directory, 'migration-codex') } };
  // Use the legacy project-local location so tests never inspect the real home.
  const legacy = path.join(directory, '.canvas-data'); await rename(store.dataRoot, legacy);
  const migrated = await dataDirectory(directory, undefined, location);
  assert.equal(await readFile(path.join(migrated, 'workspace.json'), 'utf8'), await readFile(path.join(legacy, 'workspace.json'), 'utf8'));
  assert.equal(JSON.parse(await readFile(path.join(migrated, 'preferences.json'), 'utf8')).theme, 'paper');
  const manifestPath = path.join('canvases', id, 'manifest.json');
  assert.equal(JSON.parse(await readFile(path.join(migrated, manifestPath), 'utf8')).canvasId, id);
  assert.ok(JSON.parse(await readFile(path.join(migrated, manifestPath), 'utf8')).deletedAt);
  assert.equal(await readFile(path.join(migrated, 'canvases', id, 'source/1.tsx'), 'utf8'), await readFile(path.join(legacy, 'canvases', id, 'source/1.tsx'), 'utf8'));
  await assert.rejects(access(path.join(migrated, 'preview-1.1.0.json')), { code: 'ENOENT' });
  await writeFile(path.join(migrated, 'preferences.json'), JSON.stringify({ theme: 'midnight' }));
  await dataDirectory(directory, undefined, location);
  assert.equal(JSON.parse(await readFile(path.join(migrated, 'preferences.json'), 'utf8')).theme, 'midnight');
});
