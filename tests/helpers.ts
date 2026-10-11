import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CanvasStore } from '../packages/runtime/src/store.js';

export const root = process.cwd();
export const source = (text = 'Hello canvas') => `import { Text } from '@codex-canvas/sdk'; export default function Canvas() { return <Text>${text}</Text>; }`;
export async function workspace(t: { after(fn: () => Promise<void>): void }) {
  const directory = await mkdtemp(path.join(tmpdir(), 'codex-canvas-test-'));
  t.after(async () => { await rm(directory, { recursive: true, force: true }); });
  const store = new CanvasStore(path.join(directory, 'data'), root);
  await store.init();
  return { store, directory };
}
