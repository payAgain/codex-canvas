import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CanvasStore } from '../packages/runtime/src/store.js';
import { CanvasFiles } from '../packages/runtime/src/files.js';
import { compile } from '../packages/runtime/src/compiler.js';
import { root, source, workspace } from './helpers.js';

test('failed builds retain published content, history and independent state after restart', async t => {
  const { store } = await workspace(t);
  const a = await store.publish('First', source());
  assert.equal(a.ok, true);
  const id = a.manifest.canvasId;
  await store.setState(id, 0, 'filter', 'team-a');
  const bad = await store.publish('First', 'export default function Canvas() { return <Missing />; }', id, 1);
  assert.equal(bad.ok, false);
  assert.equal(bad.manifest.sourceRevision, 2);
  assert.equal(bad.manifest.publishedRevision, 1);
  assert.equal(bad.manifest.buildHash, a.manifest.buildHash);
  const reopened = new CanvasStore(store.dataRoot, root); await reopened.init();
  assert.equal(reopened.workspaceId, store.workspaceId);
  const read = await reopened.read(id, 1, true);
  assert.equal(read.source, source());
  assert.equal(read.state.values.filter, 'team-a');
  assert.ok(read.bundle);
  const b = await store.publish('Second', source('Other canvas'));
  assert.deepEqual((await store.read(b.manifest.canvasId)).state.values, {});
  assert.equal((await store.publish('First fixed', source('Fixed'), id, 2)).manifest.publishedRevision, 3);
});

test('concurrent writers reject stale source and state versions without losing updates', async t => {
  const { store } = await workspace(t);
  const id = (await store.publish('Concurrency', source())).manifest.canvasId;
  const other = new CanvasStore(store.dataRoot, root); await other.init();
  const updates = await Promise.allSettled([store.publish('A', source('A'), id, 1), other.publish('B', source('B'), id, 1)]);
  assert.equal(updates.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(updates.find(r => r.status === 'rejected')?.reason.code, 'REVISION_CONFLICT');
  const states = await Promise.allSettled([store.setState(id, 0, 'a', 1), other.setState(id, 0, 'b', 2)]);
  assert.equal(states.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(states.find(r => r.status === 'rejected')?.reason.code, 'STATE_CONFLICT');
  await assert.rejects(store.setState(id, 1, '__proto__', {}), { code: 'INVALID_KEY' });
});

test('delete/restore preserve identity and files; deleted artifacts reject reads and updates', async t => {
  const { store, directory } = await workspace(t);
  const file = path.join(directory, 'source.tsx'); await writeFile(file, source());
  const files = new CanvasFiles(store);
  const id = (await files.open(file)).manifest.canvasId;
  await store.setState(id, 0, 'count', 7);
  await store.setDeleted(id, 1, true);
  assert.equal((await store.list()).length, 0);
  assert.equal((await store.list(true))[0]?.canvasId, id);
  await assert.rejects(store.read(id), { code: 'DELETED' });
  await assert.rejects(store.publish('Changed', source('Changed'), id, 1), { code: 'DELETED' });
  await files.sync();
  assert.equal(await readFile(file, 'utf8'), source());
  await store.setDeleted(id, 1, false);
  assert.equal((await store.read(id)).state.values.count, 7);
  assert.equal((await files.open(file)).manifest.canvasId, id);
});

test('file watching reuses identity, preserves failed builds, and detects independent edits', async t => {
  const { store, directory } = await workspace(t);
  const file = path.join(directory, 'watched.jsx'); await writeFile(file, source());
  const files = new CanvasFiles(store);
  const first = await files.open(file); const id = first.manifest.canvasId;
  assert.equal((await files.open(file)).manifest.sourceRevision, 1);
  await writeFile(file, 'export default function Canvas() { return <Missing />; }'); await files.sync();
  assert.equal((await store.manifest(id)).publishedRevision, 1);
  await writeFile(file, source('File v3')); await files.sync();
  assert.equal((await store.manifest(id)).publishedRevision, 3);
  await store.publish('Independent', source('Editor version'), id, 3);
  await writeFile(file, source('External edit')); await files.sync();
  assert.ok(files.errors.has(id));
  assert.equal((await store.read(id)).source, source('Editor version'));
  await assert.rejects(files.open('relative.tsx'), { code: 'ABSOLUTE_PATH_REQUIRED' });
});

test('selection feedback is revision-bound and reports only unique source text matches', async t => {
  const { store } = await workspace(t);
  const id = (await store.publish('Feedback', source())).manifest.canvasId;
  const part = { domPath: '#root > p:nth-child(1)', tag: 'p', text: 'Hello canvas', label: 'paragraph' };
  const feedback = await store.saveFeedback(id, 1, 1, part, 'Make this concise');
  assert.equal(feedback.sourceLocation?.match, 'unique-text');
  const saved = JSON.parse(await readFile(path.join(store.dir(id), 'feedback', `${feedback.feedbackId}.json`), 'utf8'));
  assert.equal(saved.canvasId, id);
  await store.publish('Updated', source('New text'), id, 1);
  await assert.rejects(store.saveFeedback(id, 1, 1, part, 'Old request'), { code: 'STALE_SELECTION' });
});

test('compiler rejects filesystem, dynamic imports and references before executing user code', async () => {
  for (const text of ["import fs from 'node:fs'; export default () => null;", "import('./private.js'); export default () => null;", '/// <reference path="./private.ts" />\nexport default () => null;']) {
    const result = await compile(text, root);
    assert.ok(result.diagnostics.some(d => d.phase === 'policy'));
    assert.equal(result.buildHash, undefined);
  }
});
