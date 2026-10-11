import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { root, workspace, source } from './helpers.js';

for (const compatibility of [false, true]) test(`MCP ${compatibility ? 'historical identity' : 'primary'} loads resources and reconnects saved artifact identities`, async t => {
  const { store } = await workspace(t);
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.join(root, 'scripts/start-mcp.mjs'), '--data-dir', store.dataRoot, ...(compatibility ? ['--compat'] : [])], stderr: 'pipe' });
  const client = new Client({ name: 'canvas-regression', version: '1.0.0' });
  t.after(async () => { await client.close(); });
  await client.connect(transport);
  const { tools } = await client.listTools();
  if (compatibility) {
    assert.ok(tools.every(tool => (tool._meta as any)?.ui?.visibility?.length === 1 && (tool._meta as any).ui.visibility[0] === 'app'));
    assert.ok(tools.every(tool => !(tool._meta as any)?.['openai/ui']?.entrypoints));
  } else assert.ok(tools.some(tool => tool.name === 'canvas_delete'));
  const published: any = await client.callTool({ name: 'canvas_publish', arguments: { title: 'MCP fixture', source: source() } });
  assert.equal(published.isError, undefined);
  const id = published.structuredContent.manifest.canvasId;
  for (const uri of ['ui://codex-canvas/app.html', 'ui://codex-canvas/0.3.1/app.html', 'ui://codex-canvas/0.4.0/app.html', 'ui://codex-canvas/0.4.1/app.html', (tools.find(tool => tool.name === 'canvas_open')!._meta as any).ui.resourceUri]) {
    const resource = await client.readResource({ uri });
    assert.equal(resource.contents[0]?.mimeType, 'text/html;profile=mcp-app');
    assert.match(String(resource.contents[0]?.text), /data-version="1\.0\.0"/);
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
