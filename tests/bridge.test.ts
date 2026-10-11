import test from 'node:test';
import assert from 'node:assert/strict';
import { HostBridge } from '../packages/host-bridge/src/index.js';

const failure = (code: string) => ({ isError: true, content: [{ type: 'text', text: JSON.stringify({ code, message: code }) }] });
const success = (structuredContent: unknown = {}) => ({ content: [], structuredContent });

test('native reconnect renews an expired token and preserves the explicit artifact binding', async () => {
  const bridge = new HostBridge(); bridge.session = 'before';
  let expired = false, writes = 0, connections = 0;
  const id = '00000000-0000-4000-8000-000000000001';
  bridge.app = { async callServerTool({ name, arguments: args }: any) {
    if (name === 'canvas_connect') { connections++; assert.equal(args.canvasId, id); return { ...success(), _meta: { uiSession: 'after' } }; }
    if (args.op === 'read') return success({ manifest: { canvasId: id } });
    if (expired && args.session === 'before') return failure('INVALID_SESSION');
    writes++; return success({ saved: true });
  } } as any;
  await bridge.call('read', { canvasId: id }); expired = true;
  await bridge.call('state', { canvasId: id });
  assert.equal(connections, 1); assert.equal(writes, 1); assert.equal(bridge.session, 'after');
});

test('native bridge never replays mutations after an ambiguous transport failure', async () => {
  const bridge = new HostBridge(); bridge.session = 'token'; let calls = 0;
  bridge.app = { async callServerTool() { calls++; throw new Error('connection closed after write'); } } as any;
  await assert.rejects(bridge.call('update', {}), /connection closed/); assert.equal(calls, 1);
});

test('binding-sensitive UI calls are serialized to preserve user selection order', async () => {
  const bridge = new HostBridge(); bridge.session = 'token'; const events: string[] = [];
  bridge.app = { async callServerTool({ arguments: args }: any) {
    events.push(`start:${args.args.canvasId}`);
    await new Promise(r => setTimeout(r, args.args.canvasId === 'a' ? 20 : 0));
    events.push(`end:${args.args.canvasId}`); return success({ manifest: { canvasId: args.args.canvasId } });
  } } as any;
  await Promise.all([bridge.call('read', { canvasId: 'a' }), bridge.call('read', { canvasId: 'b' })]);
  assert.deepEqual(events, ['start:a', 'end:a', 'start:b', 'end:b']);
});
