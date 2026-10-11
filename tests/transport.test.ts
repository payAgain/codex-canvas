import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { CanvasService } from '../packages/mcp-server/src/service.js';
import { serve } from '../packages/mcp-server/src/http.js';
import { workspace, root, source } from './helpers.js';

test('failed canvas reads must not switch an existing UI binding', async t => {
  const { store } = await workspace(t); const service = new CanvasService(store, root);
  const id = (await store.publish('Bound', source())).manifest.canvasId;
  const { uiSession } = service.bind(id);
  await assert.rejects(service.call(uiSession, 'read', { canvasId: '00000000-0000-4000-8000-000000000000' }), { code: 'NOT_FOUND' });
  assert.equal(service.binding(uiSession).canvasId, id);
  await service.call(uiSession, 'state', { canvasId: id, baseStateRevision: 0, key: 'count', value: 1 });
  await assert.rejects(service.call('invalid', 'delete', { canvasId: id, baseRevision: 1 }), { code: 'INVALID_SESSION' });
  assert.equal((await store.list()).length, 1);
});

test('HTTP authenticates UI requests and refuses cross-origin, invalid host and oversized input', async t => {
  const { store } = await workspace(t); const service = new CanvasService(store, root);
  const server = await serve(service, '<!doctype html><title>Canvas</title>', 0);
  t.after(async () => { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())); });
  const base = service.baseUrl; const { uiSession } = service.bind();
  const headers = { Authorization: `Bearer ${uiSession}`, 'Content-Type': 'application/json' };
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/api/ui`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
  assert.equal((await fetch(`${base}/api/ui`, { method: 'POST', headers: { ...headers, Origin: 'https://example.com' }, body: '{}' })).status, 403);
  const badHost = await new Promise<number | undefined>((resolve, reject) => { const req = request(base, { headers: { Host: 'example.com' } }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); req.end(); });
  assert.equal(badHost, 403);
  assert.equal((await fetch(`${base}/api/ui`, { method: 'POST', headers, body: '{' })).status, 400);
  assert.equal((await fetch(`${base}/api/ui`, { method: 'POST', headers, body: 'x'.repeat(512001) })).status, 413);
  const response = await fetch(`${base}/api/bootstrap`, { method: 'POST', headers, body: '{}' });
  const fresh = await response.json(); assert.notEqual(fresh.session, uiSession);
  const list = await fetch(`${base}/api/ui`, { method: 'POST', headers: { ...headers, Authorization: `Bearer ${fresh.session}` }, body: JSON.stringify({ op: 'list' }) });
  assert.deepEqual((await list.json()).canvases, []);
});
