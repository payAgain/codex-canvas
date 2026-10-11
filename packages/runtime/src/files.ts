import { open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CanvasError } from './contracts.js';
import type { CanvasStore } from './store.js';

// Only explicitly opened files become watched inputs. Source is never imported
// into Node: CanvasStore sends it through the isolated browser compiler.
export class CanvasFiles {
  errors = new Map<string, string>();
  private syncing = false;
  constructor(private store: CanvasStore) {}
  async open(filePath: string, title?: string, watch = true, syncId?: string) {
    if (!path.isAbsolute(filePath)) throw new CanvasError('ABSOLUTE_PATH_REQUIRED', '请提供 TSX / JSX 文件的绝对路径。');
    const canonical = await realpath(filePath);
    if (!/\.(tsx|jsx)$/i.test(canonical)) throw new CanvasError('UNSUPPORTED_FILE', '目前支持单文件 .tsx / .jsx 画布，组件从 @codex-canvas/sdk 导入。');
    const handle = await open(canonical, 'r');
    let source: string;
    try {
      const info = await handle.stat();
      if (!info.isFile()) throw new CanvasError('NOT_A_FILE', '请选择普通文件。');
      if (info.size > 256000) throw new CanvasError('SOURCE_LIMIT', '画布源码上限为 256 KB。');
      const buffer = Buffer.alloc(256001);
      let length = 0;
      while (length < buffer.length) {
        const part = await handle.read(buffer, length, buffer.length - length, null);
        if (!part.bytesRead) break;
        length += part.bytesRead;
      }
      if (length > 256000) throw new CanvasError('SOURCE_LIMIT', '画布源码上限为 256 KB。');
      source = new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length));
    } finally { await handle.close(); }
    const identity = process.platform === 'win32' ? canonical.toLowerCase() : canonical;
    const existing = (await this.store.list()).find(m => m.sourceFile?.path === identity);
    const result = await this.store.publish(title ?? existing?.title ?? path.basename(canonical), source, syncId, existing?.sourceRevision,
      { path: identity, hash: createHash('sha256').update(source).digest('hex'), watch });
    this.errors.delete(result.manifest.canvasId);
    return result;
  }
  async sync() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      for (const item of await this.store.list()) {
        if (!item.sourceFile?.watch) continue;
        try { await this.open(item.sourceFile.path, undefined, true, item.canvasId); }
        catch (e) { this.errors.set(item.canvasId, e instanceof Error ? e.message : String(e)); }
      }
    } finally { this.syncing = false; }
  }
}
