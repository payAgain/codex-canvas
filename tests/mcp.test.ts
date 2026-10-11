import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { root, workspace, source } from './helpers.js';

test('CLI refuses implicit browser delivery before creating a library', async t => {
  const { directory } = await workspace(t);
  const untouched = path.join(directory, 'must-not-create');
  const result = spawnSync(process.execPath, [path.join(root, 'dist/cli.mjs'), 'open', '--data-dir', untouched], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).code, 'NATIVE_PANEL_REQUIRED');
  await assert.rejects(access(untouched), { code: 'ENOENT' });
});

for (const compatibility of [false, true]) test(`MCP ${compatibility ? 'historical identity' : 'primary'} loads resources and reconnects saved artifact identities`, async t => {
  const { store } = await workspace(t);
  const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(root, 'scripts/start-mcp.mjs'), '--data-dir', store.dataRoot, ...(compatibility ? ['--compat'] : [])], stderr: 'pipe' });
  const client = new Client({ name: 'canvas-regression', version: '1.0.0' });
  t.after(async () => { await client.close(); });
  await client.connect(transport);
  assert.ok(client.getInstructions()?.includes('native MCP App'));
  const { tools } = await client.listTools();
  if (compatibility) {
    assert.ok(tools.every(tool => (tool._meta as any)?.ui?.visibility?.length === 1 && (tool._meta as any).ui.visibility[0] === 'app'));
    assert.ok(tools.every(tool => !(tool._meta as any)?.['openai/ui']?.entrypoints));
  } else {
    assert.ok(tools.some(tool => tool.name === 'canvas_delete'));
    assert.equal(tools.find(tool => tool.name === 'canvas_purge')?.annotations?.destructiveHint, true);
  }
  const published: any = await client.callTool({ name: 'canvas_publish', arguments: { title: 'MCP fixture', source: source() } });
  assert.equal(published.isError, undefined);
  assert.deepEqual(published.structuredContent.presentation, { mode: 'native-mcp-app', browserFallback: false });
  assert.equal(published.structuredContent.previewUrl, undefined);
  assert.equal(published._meta.previewUrl, undefined);
  assert.ok(!published.content[0].text.includes(published._meta.uiSession));
  const id = published.structuredContent.manifest.canvasId;
  for (const uri of ['ui://codex-canvas/app.html', 'ui://codex-canvas/0.3.1/app.html', 'ui://codex-canvas/0.4.0/app.html', 'ui://codex-canvas/0.4.1/app.html', 'ui://codex-canvas/1.0.0/app.html', 'ui://codex-canvas/1.1.0/app.html', (tools.find(tool => tool.name === 'canvas_open')!._meta as any).ui.resourceUri]) {
    const resource = await client.readResource({ uri });
    assert.equal(resource.contents[0]?.mimeType, 'text/html;profile=mcp-app');
    assert.ok(String(resource.contents[0]?.text).includes(`data-version="${version}"`));
  }
  const connected: any = await client.callTool({ name: 'canvas_connect', arguments: { canvasId: id } });
  assert.notEqual(connected._meta.uiSession, published._meta.uiSession);
  const read: any = await client.callTool({ name: 'canvas_ui', arguments: { session: connected._meta.uiSession, op: 'read', args: { canvasId: id } } });
  assert.equal(read.structuredContent.manifest.canvasId, id);
  const invalid: any = await client.callTool({ name: 'canvas_ui', arguments: { session: 'expired', op: 'delete', args: { canvasId: id, baseRevision: 1 } } });
  assert.equal(invalid.isError, true);
  assert.equal(JSON.parse(invalid.content[0].text).code, 'INVALID_SESSION');
  assert.equal((await store.list()).length, 1);
});
