import { randomUUID, randomBytes } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { CanvasStore, atomicJson } from '../../runtime/src/store.js';
import { CanvasError, themePreferences, type Json } from '../../runtime/src/contracts.js';
import { CanvasFiles } from '../../runtime/src/files.js';
import { openLibraryFolder } from './settings.js';

const id = z.string().uuid();
const title = z.string().min(1).max(160);
const source = z.string().max(256000);
export const publishSchema = { title, source };
export const updateSchema = { canvasId: id, baseRevision: z.number().int().positive(), title, source };
export const openFileSchema = { path: z.string().min(1).max(4096), title: title.optional(), watch: z.boolean().default(true) };
export const deleteSchema = { canvasId: id, baseRevision: z.number().int().positive() };
export const purgeSchema = { ...deleteSchema, deletedAt: z.string().datetime(), confirmTitle: title };
const selectionSchema = z.object({ domPath: z.string().min(1).max(2000), tag: z.string().max(40), text: z.string().max(4000), label: z.string().max(160), partId: z.string().max(160).optional() });
const feature = z.object({ state: z.enum(['supported', 'unsupported', 'unknown']), evidence: z.string().max(1000) });
const probeSchema = z.object({
  observedAt: z.string().max(64), mode: z.enum(['browser', 'mcp']),
  host: z.object({ name: z.string().max(150).optional(), version: z.string().max(80).optional(), platform: z.string().max(80).optional() }),
  theme: z.string().max(30), features: z.record(z.string().max(60), feature),
  advertisedCapabilities: z.object({ serverTools: z.boolean().optional(), serverResources: z.boolean().optional(), updateModelContext: z.boolean().optional(), message: z.boolean().optional() }),
});
export class CanvasService {
  sessions = new Map<string, { canvasId?: string; probeId: string }>();
  baseUrl = '';
  files: CanvasFiles;
  constructor(public store: CanvasStore, public root: string) { this.files = new CanvasFiles(store); }
  bind(canvasId?: string) {
    const token = randomBytes(32).toString('hex');
    const binding = { ...(canvasId ? { canvasId } : {}), probeId: randomUUID() };
    this.sessions.set(token, binding);
    return { uiSession: token, probeId: binding.probeId, canvasId,
      ...(this.baseUrl ? { previewUrl: `${this.baseUrl}/#session=${token}` } : {}) };
  }
  binding(token: string) {
    const session = this.sessions.get(token);
    if (!session) throw new CanvasError('INVALID_SESSION', '会话已过期，请重新打开画布。', 401);
    return session;
  }
  async purge(data: { canvasId: string; baseRevision: number; deletedAt: string; confirmTitle: string }) {
    const result = await this.store.purge(data.canvasId, data.baseRevision, data.deletedAt, data.confirmTitle);
    for (const binding of this.sessions.values()) if (binding.canvasId === data.canvasId) delete binding.canvasId;
    this.files.errors.delete(data.canvasId);
    return result;
  }
  async call(token: string, op: string, raw: unknown) {
    const binding = this.binding(token);
    const args = z.record(z.string(), z.unknown()).parse(raw);
    switch (op) {
      case 'list': return { ...await this.store.library(), fileErrors: Object.fromEntries(this.files.errors) };
      case 'setTheme': return this.store.setTheme(z.enum(themePreferences).parse(args.theme));
      case 'openLibraryFolder': {
        await openLibraryFolder(path.join(this.store.dataRoot, 'canvases'));
        return { opened: true };
      }
      case 'delete':
      case 'restore': {
        const data = z.object(deleteSchema).parse(args);
        const result = await this.store.setDeleted(data.canvasId, data.baseRevision, op === 'delete');
        if (op === 'delete' && binding.canvasId === data.canvasId) delete binding.canvasId;
        this.files.errors.delete(data.canvasId);
        return result;
      }
      case 'purge': return this.purge(z.object(purgeSchema).parse(args));
      case 'feedback': {
        const data = z.object({ canvasId: id, sourceRevision: z.number().int().positive(), publishedRevision: z.number().int().positive(), selection: selectionSchema, request: z.string().max(4000) }).parse(args);
        this.assertBound(binding, data.canvasId);
        return this.store.saveFeedback(data.canvasId, data.sourceRevision, data.publishedRevision, data.selection, data.request);
      }
      case 'openFile': {
        const data = z.object(openFileSchema).parse(args);
        const result = await this.files.open(data.path, data.title, data.watch);
        binding.canvasId = result.manifest.canvasId; return result;
      }
      case 'read': {
        const canvasId = id.parse(args.canvasId);
        const document = await this.store.read(canvasId, undefined, true);
        binding.canvasId = canvasId;
        return document;
      }
      case 'publish': {
        const data = z.object(publishSchema).parse(args);
        const result = await this.store.publish(data.title, data.source);
        binding.canvasId = result.manifest.canvasId; return result;
      }
      case 'update': {
        const data = z.object(updateSchema).parse(args);
        this.assertBound(binding, data.canvasId);
        return this.store.publish(data.title, data.source, data.canvasId, data.baseRevision);
      }
      case 'state': {
        const data = z.object({ canvasId: id, baseStateRevision: z.number().int().nonnegative(), key: z.string(), value: z.json() }).parse(args);
        this.assertBound(binding, data.canvasId);
        return this.store.setState(data.canvasId, data.baseStateRevision, data.key, data.value as Json);
      }
      case 'example': {
        const name = z.enum(['report', 'architecture', 'review']).parse(args.name);
        const titles = { report: '交付观察 · 示例报告', architecture: '画布系统 · 模块关系', review: '发布流程 · 审查示例' };
        const content = await readFile(path.join(this.root, 'examples', `${name}.tsx`), 'utf8');
        const result = await this.store.publish(titles[name], content);
        binding.canvasId = result.manifest.canvasId; return result;
      }
      case 'probe': return { probeId: binding.probeId, observedAt: new Date().toISOString(), workspaceId: this.store.workspaceId };
      case 'probeSave': {
        const record = probeSchema.parse(args);
        // Save only the allowlisted diagnostic fields, never raw host/chat payloads.
        const dir = path.join(this.store.dataRoot, 'probes'); await mkdir(dir, { recursive: true });
        await atomicJson(path.join(dir, `${binding.probeId}.json`), { ...record, probeId: binding.probeId });
        return { saved: true, probeId: binding.probeId };
      }
      default: throw new CanvasError('UNKNOWN_OPERATION', '未知的界面操作。');
    }
  }
  assertBound(binding: { canvasId?: string }, canvasId: string) {
    if (binding.canvasId !== canvasId) throw new CanvasError('BINDING_MISMATCH', '画布已切换，请重新加载后操作。', 409);
  }
}
