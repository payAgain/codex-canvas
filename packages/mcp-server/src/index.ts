import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { CanvasStore, atomicJson } from '../../runtime/src/store.js';
import { CanvasService, publishSchema, updateSchema, openFileSchema, deleteSchema, purgeSchema } from './service.js';
import type { OpenAIUiResourceMetadata, OpenAIUiToolMetadata } from '@openai/mcp-extensions/server';
import { serve } from './http.js';
import { dataDirectory } from './settings.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (key: string) => { const index = args.indexOf(key); return index < 0 ? undefined : args[index + 1]; };
const isStdio = args.includes('--stdio');
if (!isStdio && !args.includes('--serve')) {
  console.error(JSON.stringify({ code: 'NATIVE_PANEL_REQUIRED', message: '在 Codex 中请通过插件打开画布。独立浏览器服务必须显式传入 --serve，不能作为原生面板的自动回退。' }));
  process.exit(1);
}
const dataRoot = await dataDirectory(root, option('--data-dir'));
const store = new CanvasStore(dataRoot, root); await store.init();
const service = new CanvasService(store, root);
const html = await readFile(path.join(root, 'dist/app.html'), 'utf8');
const compatibility = args.includes('--compat');
// Plugin tools only render through the host's MCP App. A browser server is
// started exclusively by the standalone --serve/CLI browser workflow.
const http = isStdio ? undefined : await serve(service, html, Number(option('--port') ?? process.env.CANVAS_PORT ?? 4318));
// Compatibility identities only serve saved cards; the primary service owns
// background file refresh, avoiding one watcher per historical server name.
if (!compatibility) {
  const watchTimer = setInterval(() => { service.files.sync().catch(e => console.error('Canvas file refresh:', e.message)); }, 2000);
  watchTimer.unref();
}
if (!isStdio && option('--ready-file')) await atomicJson(path.resolve(option('--ready-file')!), { pid: process.pid, version: '1.1.1', ...service.bind() });
if (isStdio) {
  const server = new McpServer({ name: 'codex-canvas', version: '1.1.1' }, {
    instructions: 'Open canvases through this plugin\'s native MCP App tools: canvas_open_file, canvas_open, or canvas_publish. Deliver the native panel. Do not open a browser, use open_in_codex with a localhost URL, or run a CLI/server preview as a fallback. If native tools or the host panel are unavailable, explain the failure and stop the opening step. Browser mode requires an explicit user request.',
  });
  // A different release must not reuse a host-cached HTML resource.
  const uri = 'ui://codex-canvas/1.1.1/app.html';
  const openMeta = { ui: { resourceUri: uri, ...(compatibility ? { visibility: ['app' as const] } : {}) }, 'openai/ui': { preferredModelDisplayMode: 'fullscreen' } satisfies OpenAIUiToolMetadata };
  const meta = compatibility ? openMeta : { ...openMeta, 'openai/ui': { ...openMeta['openai/ui'], entrypoints: [{ type: 'thread' }] } };
  const resourceMeta = { ui: { csp: { frameDomains: ['about:'] } }, 'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['fullscreen'] } satisfies OpenAIUiResourceMetadata };
  const safe = (handler: (args: any) => Promise<any>) => async (input: any) => {
    try { return await handler(input); }
    catch (e: any) { return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ code: e.code ?? 'ERROR', message: e.message }) }] }; }
  };
  function result(data: Record<string, unknown>, binding?: ReturnType<CanvasService['bind']>) {
    data = { runtimeVersion: '1.1.1', ...data, ...(binding ? { canvasId: binding.canvasId, probeId: binding.probeId,
      presentation: { mode: 'native-mcp-app', browserFallback: false } } : {}) };
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }],
      structuredContent: data,
      ...(binding ? { _meta: { uiSession: binding.uiSession } } : {}) };
  }
  registerAppResource(server, 'canvas-app', uri, { description: 'Codex Canvas native conversation panel', _meta: resourceMeta }, async () => ({ contents: [{ uri, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: resourceMeta }] }));
  // Older saved tool cards can request their original URI after reconnecting.
  for (const [index, legacyUri] of ['ui://codex-canvas/app.html', 'ui://codex-canvas/0.3.1/app.html', 'ui://codex-canvas/0.4.0/app.html', 'ui://codex-canvas/0.4.1/app.html', 'ui://codex-canvas/1.0.0/app.html', 'ui://codex-canvas/1.1.0/app.html'].entries()) {
    registerAppResource(server, `canvas-app-legacy-${index}`, legacyUri, { _meta: resourceMeta }, async () => ({ contents: [{ uri: legacyUri, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: resourceMeta }] }));
  }
  registerAppTool(server, 'canvas_probe', { title: '打开插件画布 / 能力探针', description: 'Open the native Codex Canvas MCP App and inspect actual host support. No browser fallback or preview URL is provided.', inputSchema: {}, _meta: meta }, safe(async () => result({ status: 'probe-ready' }, service.bind())));
  registerAppTool(server, 'canvas_publish', { title: '在插件中发布新画布', description: 'Publish TSX importing only @codex-canvas/sdk and display it in the native Codex Canvas MCP App. Returns source diagnostics or the published canvas. Never replace the native panel with a browser preview.', inputSchema: publishSchema, _meta: openMeta }, safe(async input => {
    const published = await store.publish(input.title, input.source); return result({ ...published }, service.bind(published.manifest.canvasId));
  }));
  registerAppTool(server, 'canvas_open', { title: '在插件中打开已有画布', description: 'Open one saved artifact by its explicit ID in the native Codex Canvas MCP App. Deliver the native panel; no browser fallback or preview URL is provided.', inputSchema: { canvasId: z.string().uuid() }, _meta: openMeta }, safe(async ({ canvasId }) => result({ manifest: await store.manifest(canvasId) }, service.bind(canvasId))));
  registerAppTool(server, 'canvas_open_file', { title: '在插件中打开 TSX / JSX 文件', description: 'Open an explicit absolute local .tsx/.jsx path in the native Codex Canvas MCP App, without a canvas ID. Imports only @codex-canvas/sdk. Reuses its saved identity and watches file changes by default, preserving the last successful render on errors. Deliver the native panel; no browser fallback or preview URL is provided.', inputSchema: openFileSchema, _meta: openMeta }, safe(async input => {
    const opened = await service.files.open(input.path, input.title, input.watch);
    return result({ ...opened }, service.bind(opened.manifest.canvasId));
  }));
  registerAppTool(server, 'canvas_view_file', { title: 'Canvas 文件查看器', description: 'Host file entrypoint for TSX/JSX resources. The trusted app reads the host resource and compiles it as a canvas.', inputSchema: { file: z.object({ name: z.string(), resourceUri: z.string() }).optional() }, _meta: { ui: { ...meta.ui, visibility: ['app'] }, ...(!compatibility ? { 'openai/ui': { entrypoints: [{ type: 'file', extensions: ['tsx', 'jsx'] }] } } : {}) } }, safe(async () => result({ status: 'file-viewer-ready' }, service.bind())));
  registerAppTool(server, 'canvas_connect', { description: 'Initialize or renew a server-controlled UI session. Optionally restore an explicit canvas binding.', inputSchema: { canvasId: z.string().uuid().optional() }, _meta: { ui: { ...meta.ui, visibility: ['app'] } } }, safe(async ({ canvasId }) => {
    // Reconnect even if another panel deleted the bound artifact. The next
    // list clears it; read/write operations still enforce the deleted state.
    if (canvasId) await store.manifest(canvasId, true);
    return result({ status: 'connected' }, service.bind(canvasId));
  }));
  if (!compatibility) {
  server.registerTool('canvas_read', { description: 'Read source, manifest and independent state; optionally read an earlier source revision.', inputSchema: { canvasId: z.string().uuid(), revision: z.number().int().positive().optional() }, annotations: { readOnlyHint: true } }, safe(async ({ canvasId, revision }) => result({ ...await store.read(canvasId, revision) })));
  server.registerTool('canvas_list', { description: 'List saved canvases and their storage paths. Set deleted to list recoverable deleted canvases.', inputSchema: { deleted: z.boolean().optional() }, annotations: { readOnlyHint: true } }, safe(async ({ deleted }) => {
    const library = await store.library(); return result({ ...library, canvases: deleted ? library.deleted : library.canvases });
  }));
  server.registerTool('canvas_delete', { description: 'Move an explicitly identified canvas to the recoverable deleted list. Keeps source files untouched.', inputSchema: deleteSchema, annotations: { destructiveHint: false } }, safe(async ({ canvasId, baseRevision }) => result(await store.setDeleted(canvasId, baseRevision, true))));
  server.registerTool('canvas_restore', { description: 'Restore an explicitly identified deleted canvas with its saved history and state.', inputSchema: deleteSchema, annotations: { destructiveHint: false } }, safe(async ({ canvasId, baseRevision }) => result(await store.setDeleted(canvasId, baseRevision, false))));
  server.registerTool('canvas_purge', { description: 'Permanently delete one already-deleted canvas and its library source history, builds, state and feedback. Irreversible. Require explicit user confirmation for this exact canvas immediately before calling; use its current canvasId, sourceRevision, deletedAt and exact title as confirmTitle. External source files and migration backups are preserved.', inputSchema: purgeSchema, annotations: { destructiveHint: true } }, safe(async input => result(await service.purge(input))));
  }
  registerAppTool(server, 'canvas_update', { description: 'Update complete TSX with optimistic baseRevision and display it in the native Codex Canvas MCP App. Failed builds preserve the previous published revision. No browser fallback is provided.', inputSchema: updateSchema, _meta: openMeta }, safe(async input => {
    const published = await store.publish(input.title, input.source, input.canvasId, input.baseRevision);
    return result({ ...published }, service.bind(input.canvasId));
  }));
  registerAppTool(server, 'canvas_ui', { description: 'Bound UI operations. Session token comes only from the tool result metadata.', inputSchema: { session: z.string(), op: z.string(), args: z.record(z.string(), z.unknown()) }, _meta: { ui: { resourceUri: uri, visibility: ['app'] } } }, safe(async ({ session, op, args }) => result(await service.call(session, op, args) as Record<string, unknown>)));
  await server.connect(new StdioServerTransport());
  process.stdin.on('end', () => { http?.close(); process.exit(0); });
} else {
  console.log(`Codex Canvas 1.1.1 · explicit browser mode\n${service.bind().previewUrl}\nData: ${dataRoot}\nCtrl+C to stop.`);
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { http?.close(); process.exit(0); });
