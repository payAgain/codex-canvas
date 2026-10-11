import { mkdir, readFile, writeFile, rename, readdir, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { compile } from './compiler.js';
import { CanvasError, type Manifest, type CanvasState, type Json, type CanvasDocument, type PartSelection, type CanvasFeedback } from './contracts.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function atomicJson(file: string, value: unknown) {
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2), { flag: 'wx' });
  await rename(temp, file);
}
async function json<T>(file: string): Promise<T> { return JSON.parse(await readFile(file, 'utf8')) as T; }
export class CanvasStore {
  workspaceId = '';
  constructor(public dataRoot: string, public projectRoot: string) {}
  async init() {
    await mkdir(path.join(this.dataRoot, 'canvases'), { recursive: true });
    await this.lock(async () => {
      try { this.workspaceId = (await json<{ workspaceId: string }>(path.join(this.dataRoot, 'workspace.json'))).workspaceId; }
      catch (e: any) {
        if (e.code !== 'ENOENT') throw e;
        this.workspaceId = randomUUID();
        await atomicJson(path.join(this.dataRoot, 'workspace.json'), { workspaceId: this.workspaceId, schemaVersion: 1 });
      }
    });
  }
  // One filesystem lock covers all writers, including other MCP/CLI processes.
  async lock<T>(action: () => Promise<T>): Promise<T> {
    const file = path.join(this.dataRoot, '.write.lock');
    const until = Date.now() + 30000;
    for (;;) {
      let handle;
      try { handle = await open(file, 'wx'); }
      catch (e: any) {
        if (e.code !== 'EEXIST') throw e;
        try {
          const owner = await json<{ pid: number }>(file);
          try { process.kill(owner.pid, 0); }
          catch (signal: any) { if (signal.code === 'ESRCH') { await unlink(file); continue; } }
        } catch { /* The owner may still be writing its pid. */ }
        if (Date.now() > until) throw new CanvasError('BUSY', '存储正忙，请稍后重试。', 409);
        await new Promise(r => setTimeout(r, 75)); continue;
      }
      try { await handle.writeFile(JSON.stringify({ pid: process.pid })); return await action(); }
      finally { await handle.close(); await unlink(file); }
    }
  }
  dir(id: string) {
    if (!uuid.test(id)) throw new CanvasError('INVALID_ID', '画布 ID 格式无效。');
    return path.join(this.dataRoot, 'canvases', id);
  }
  async manifest(id: string, includeDeleted = false) {
    try {
      const manifest = await json<Manifest>(path.join(this.dir(id), 'manifest.json'));
      if (manifest.deletedAt && !includeDeleted) throw new CanvasError('DELETED', '画布已移到已删除列表，可先恢复。', 410);
      return manifest;
    }
    catch (e: any) { if (e.code === 'ENOENT') throw new CanvasError('NOT_FOUND', '找不到该画布。', 404); throw e; }
  }
  async list(deleted = false) {
    const rows = [];
    for (const id of await readdir(path.join(this.dataRoot, 'canvases'))) {
      if (!uuid.test(id)) continue;
      try { const m = await this.manifest(id, true); if (Boolean(m.deletedAt) === deleted) rows.push(m); } catch (e: any) { if (e.code !== 'NOT_FOUND') throw e; }
    }
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async setDeleted(id: string, baseRevision: number, deleted: boolean) {
    return this.lock(async () => {
      const manifest = await this.manifest(id, true);
      if (manifest.sourceRevision !== baseRevision) throw new CanvasError('REVISION_CONFLICT', '画布已更新，请刷新列表后再操作。', 409);
      if (deleted) manifest.deletedAt ??= new Date().toISOString();
      else delete manifest.deletedAt;
      await atomicJson(path.join(this.dir(id), 'manifest.json'), manifest);
      return { ok: true, manifest };
    });
  }
  async saveFeedback(id: string, sourceRevision: number, publishedRevision: number, selection: PartSelection, request: string) {
    return this.lock(async () => {
      const doc = await this.read(id);
      if (doc.manifest.sourceRevision !== sourceRevision || doc.manifest.publishedRevision !== publishedRevision) {
        throw new CanvasError('STALE_SELECTION', '画布已更新，请重新选择要修改的部分。', 409);
      }
      const source = await readFile(path.join(this.dir(id), 'source', `${publishedRevision}.tsx`), 'utf8');
      // A DOM path identifies the rendered instance. Only report a source text
      // match when it is exact and unique; dynamic text may have no source line.
      const needle = selection.text.trim();
      const offset = needle.length >= 4 ? source.indexOf(needle) : -1;
      let sourceLocation: CanvasFeedback['sourceLocation'];
      if (offset >= 0 && source.indexOf(needle, offset + 1) < 0) {
        const prefix = source.slice(0, offset).split('\n');
        sourceLocation = { line: prefix.length, column: prefix.at(-1)!.length + 1, match: 'unique-text' };
      }
      const feedback: CanvasFeedback = { feedbackId: randomUUID(), canvasId: id, workspaceId: this.workspaceId,
        sourceRevision, publishedRevision, createdAt: new Date().toISOString(), selection, request,
        ...(sourceLocation ? { sourceLocation } : {}) };
      await mkdir(path.join(this.dir(id), 'feedback'), { recursive: true });
      await atomicJson(path.join(this.dir(id), 'feedback', `${feedback.feedbackId}.json`), feedback);
      return feedback;
    });
  }
  async read(id: string, revision?: number, includeBuild = false): Promise<CanvasDocument> {
    const manifest = await this.manifest(id);
    const rev = revision ?? manifest.sourceRevision;
    if (!Number.isSafeInteger(rev) || rev < 1 || rev > manifest.sourceRevision) throw new CanvasError('INVALID_REVISION', '源码版本无效。');
    const dir = this.dir(id);
    const source = await readFile(path.join(dir, 'source', `${rev}.tsx`), 'utf8');
    const state = await json<CanvasState>(path.join(dir, 'state.json'));
    const document: CanvasDocument = { manifest, source, state };
    if (includeBuild && manifest.buildHash) {
      const built = await json<{ bundle: string; css: string }>(path.join(dir, 'builds', `${manifest.buildHash}.json`));
      Object.assign(document, built);
    }
    return document;
  }
  async publish(title: string, source: string, id?: string, baseRevision?: number, file?: Omit<NonNullable<Manifest['sourceFile']>, 'importedRevision'>) {
    if (!title.trim() || title.length > 160) throw new CanvasError('INVALID_TITLE', '标题需要 1–160 个字符。');
    if (typeof source !== 'string' || Buffer.byteLength(source) > 256000) throw new CanvasError('SOURCE_LIMIT', '源码上限为 256 KB。');
    return this.lock(async () => {
      let previous = id ? await this.manifest(id) : undefined;
      if (file && !id) previous = (await this.list()).find(m => m.sourceFile?.path === file.path);
      if (file && previous) {
        if (previous.sourceFile?.hash === file.hash) {
          if (previous.sourceFile.watch !== file.watch) {
            previous.sourceFile.watch = file.watch;
            await atomicJson(path.join(this.dir(previous.canvasId), 'manifest.json'), previous);
          }
          return { ok: !previous.diagnostics.length, manifest: previous, diagnostics: previous.diagnostics };
        }
        if (previous.sourceRevision !== previous.sourceFile?.importedRevision) throw new CanvasError('FILE_CONFLICT', '画布已在编辑器或工具中修改，文件跟随已暂停。请将修改合并到源文件，或导入为新画布。', 409);
        if (!id) baseRevision = previous.sourceRevision;
      }
      const canvasId = previous?.canvasId ?? id ?? randomUUID();
      if (previous && previous.sourceRevision !== baseRevision) throw new CanvasError('REVISION_CONFLICT', `源码已更新到 r${previous.sourceRevision}，请重新读取后合并。`, 409);
      const dir = this.dir(canvasId);
      await mkdir(path.join(dir, 'source'), { recursive: true });
      await mkdir(path.join(dir, 'builds'), { recursive: true });
      const revision = (previous?.sourceRevision ?? 0) + 1;
      // A process crash can leave an uncommitted source; only the manifest is authoritative.
      await writeFile(path.join(dir, 'source', `${revision}.tsx`), source);
      const built = await compile(source, this.projectRoot);
      if (built.buildHash) await atomicJson(path.join(dir, 'builds', `${built.buildHash}.json`), { bundle: built.bundle, css: built.css });
      const now = new Date().toISOString();
      const manifest: Manifest = {
        canvasId, workspaceId: this.workspaceId, title: title.trim(), sdkVersion: '0.1', sourceRevision: revision,
        publishedRevision: built.buildHash ? revision : previous?.publishedRevision ?? null,
        buildHash: built.buildHash ?? previous?.buildHash ?? null,
        createdAt: previous?.createdAt ?? now, updatedAt: now, diagnostics: built.diagnostics,
        ...(file ? { sourceFile: { ...file, importedRevision: revision } } : previous?.sourceFile ? { sourceFile: previous.sourceFile } : {}),
      };
      if (!previous) await atomicJson(path.join(dir, 'state.json'), { stateRevision: 0, values: {} });
      await atomicJson(path.join(dir, 'manifest.json'), manifest);
      return { ok: built.diagnostics.length === 0, manifest, diagnostics: built.diagnostics };
    });
  }
  async setState(id: string, baseStateRevision: number, key: string, value: Json) {
    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new CanvasError('INVALID_KEY', '状态键格式无效。');
    if (Buffer.byteLength(JSON.stringify(value)) > 32000) throw new CanvasError('STATE_LIMIT', '单个状态值上限为 32 KB。');
    return this.lock(async () => {
      await this.manifest(id);
      const file = path.join(this.dir(id), 'state.json');
      const old = await json<CanvasState>(file);
      if (old.stateRevision !== baseStateRevision) throw new CanvasError('STATE_CONFLICT', '状态已变化，请重新读取。', 409);
      const next = { stateRevision: old.stateRevision + 1, values: { ...old.values, [key]: value } };
      if (Buffer.byteLength(JSON.stringify(next)) > 128000) throw new CanvasError('STATE_LIMIT', '画布状态上限为 128 KB。');
      await atomicJson(file, next); return next;
    });
  }
}
