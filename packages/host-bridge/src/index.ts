import { App } from '@modelcontextprotocol/ext-apps';
import { OpenAIExtensions, OpenAIFileEntrypointInputSchema } from '@openai/mcp-extensions/app';

export interface Feature { state: 'supported' | 'unsupported' | 'unknown'; evidence: string; }
export interface Probe {
  observedAt: string; mode: 'browser' | 'mcp'; host: { name?: string; version?: string; platform?: string };
  theme: string; features: Record<string, Feature>; advertisedCapabilities: unknown;
}
export class HostBridge {
  app?: App;
  extensions?: OpenAIExtensions;
  displayMode = 'inline';
  onDisplay: (() => void) | undefined;
  session = '';
  private canvasId: string | undefined;
  private reconnecting: Promise<void> | undefined;
  private callQueue: Promise<unknown> = Promise.resolve();
  theme: 'light' | 'dark' = 'light';
  onBinding: ((id?: string) => void) | undefined;
  onTheme: (() => void) | undefined;
  onFile: ((file: { uri: string; name: string; source: string }) => Promise<void>) | undefined;
  onError: ((message: string) => void) | undefined;
  probe: Probe = {
    observedAt: new Date().toISOString(), mode: 'browser', host: {}, theme: 'light', advertisedCapabilities: {},
    features: Object.fromEntries(['toolUi', 'threadEntrypoint', 'fileEntrypoint', 'theme', 'serverTools', 'modelContext', 'message', 'draft', 'resourceSubscription', 'instanceBinding'].map(key => [key, { state: 'unknown', evidence: '尚未在原生宿主中观察。' }])),
  };
  async connect() {
    const browser = location.protocol === 'http:' && location.hostname === '127.0.0.1' && location.pathname === '/';
    if (browser) {
      const scheme = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => { this.theme = scheme.matches ? 'dark' : 'light'; this.probe.theme = this.theme; this.onTheme?.(); };
      updateTheme(); scheme.addEventListener('change', updateTheme);
      const params = new URLSearchParams(location.hash.slice(1));
      const token = params.get('session') ?? sessionStorage.getItem('canvas-session') ?? '';
      if (!token) throw new Error('入口已失效，请从终端启动输出或 canvas_open 重新打开。');
      const response = await fetch('/api/bootstrap', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw new Error('会话已失效，请重新打开服务给出的链接。');
      const data = await response.json(); this.session = data.session;
      sessionStorage.setItem('canvas-session', this.session); history.replaceState(null, '', location.pathname);
      this.probe.features.toolUi = { state: 'supported', evidence: '本地浏览器外壳已连接，非原生 MCP App。' };
      this.probe.features.instanceBinding = { state: 'supported', evidence: '服务端为本界面实例颁发独立令牌。' };
      this.probe.features.message = { state: 'unsupported', evidence: '浏览器模式使用复制上下文。' };
      this.probe.features.draft = { state: 'unsupported', evidence: '浏览器模式无宿主草稿接口。' };
      return data.canvasId as string | undefined;
    }
    this.probe.mode = 'mcp';
    // Inline cards have a fixed layout. Do not feed measured viewport height
    // back into the host's iframe size (especially when restoring old cards).
    const app = this.app = new App({ name: 'Codex Canvas', version: '1.0.0' }, {}, { autoResize: false });
    const extensions = this.extensions = new OpenAIExtensions(app);
    let initialCanvasId: string | undefined;
    let fileUri: string | undefined, fileName = '画布.tsx', subscribedUri: string | undefined, connected = false, reading = false, reread = false;
    const readHostFile = async () => {
      if (!connected || !fileUri) return;
      if (reading) { reread = true; return; }
      reading = true;
      const uri = fileUri;
      try {
        if (!extensions.resources) throw new Error('宿主未提供文件资源读取接口。请使用「打开文件」导入 TSX / JSX。');
        const result = await extensions.resources.read({ uri });
        const content = result.contents[0];
        if (!content) throw new Error('宿主返回的文件内容为空。');
        const source = 'text' in content ? content.text : new TextDecoder().decode(Uint8Array.from(atob(content.blob), c => c.charCodeAt(0)));
        if (new TextEncoder().encode(source).length > 256000) throw new Error('画布源码上限为 256 KB。');
        if (uri !== fileUri) return;
        await this.onFile?.({ uri, name: fileName, source });
        this.probe.features.fileEntrypoint = { state: 'supported', evidence: '收到文件入口，已读取宿主资源并交给画布编译。' };
        if (subscribedUri !== uri) {
          try {
            if (subscribedUri) await extensions.resources.unsubscribe({ uri: subscribedUri });
            await extensions.resources.subscribe({ uri }); subscribedUri = uri;
            this.probe.features.resourceSubscription = { state: 'supported', evidence: '宿主已接受文件资源订阅。' };
          } catch (e) { this.probe.features.resourceSubscription = { state: 'unsupported', evidence: String(e).slice(0, 1000) }; }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.probe.features.fileEntrypoint = { state: 'unsupported', evidence: message.slice(0, 1000) };
        this.onError?.(message);
      } finally { reading = false; if (reread) { reread = false; void readHostFile(); } }
    };
    app.addEventListener('toolinput', ({ arguments: args }) => {
      const input = OpenAIFileEntrypointInputSchema.safeParse(args);
      if (input.success) { fileUri = input.data.file.resourceUri; fileName = input.data.file.name; void readHostFile(); }
    });
    app.ontoolresult = result => {
      // Restored tool results contain tokens from an earlier process. Keep the
      // explicit artifact identity, but obtain a fresh token over this MCP link.
      const data = result.structuredContent as { canvasId?: string; manifest?: { canvasId?: string } } | undefined;
      const id = data?.canvasId ?? data?.manifest?.canvasId;
      if (!id) return;
      initialCanvasId = id;
      if (connected) this.onBinding?.(id);
    };
    app.onhostcontextchanged = context => {
      if (context.displayMode) this.applyDisplayMode(context.displayMode);
      // Size/display-mode notifications are not theme changes. Remounting for
      // them feeds host auto-resize back into iframe replacement.
      if (context.theme && context.theme !== this.theme) {
        this.theme = context.theme; this.probe.theme = this.theme; this.onTheme?.();
      }
    };
    await Promise.race([app.connect(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error('宿主初始化在 8 秒内没有完成。请使用工具返回的浏览器链接。')), 8000))]);
    this.applyDisplayMode(app.getHostContext()?.displayMode ?? 'inline');
    if (this.displayMode === 'inline' && app.getHostContext()?.availableDisplayModes?.includes('fullscreen')) {
      await this.openPanel().catch(e => { this.probe.features.panel = { state: 'unsupported', evidence: String(e).slice(0, 1000) }; });
    }
    if (this.displayMode === 'inline') await app.sendSizeChanged({ height: 600 }).catch(() => {});
    await this.renewSession();
    connected = true;
    // Host-owned resources stay behind its capability API, never become local paths.
    extensions.resources?.addUpdateHandler(async ({ params }) => { if (params.uri === fileUri) await readHostFile(); });
    if (fileUri) await readHostFile();
    const caps = app.getHostCapabilities();
    const context = app.getHostContext();
    this.probe.host = { ...app.getHostVersion(), ...(context?.platform ? { platform: context.platform } : {}) };
    this.probe.advertisedCapabilities = { serverTools: Boolean(caps?.serverTools), serverResources: Boolean(caps?.serverResources), updateModelContext: Boolean(caps?.updateModelContext), message: Boolean(caps?.message) };
    const initialTheme = context?.theme ?? 'light';
    const changedTheme = this.theme !== initialTheme;
    this.theme = initialTheme; this.probe.theme = this.theme;
    if (changedTheme) this.onTheme?.();
    this.probe.features.toolUi = { state: 'supported', evidence: 'MCP Apps initialize 已响应。' };
    this.probe.features.theme = { state: context?.theme ? 'supported' : 'unknown', evidence: context?.theme ?? '宿主没有返回主题。' };
    this.probe.features.serverTools = { state: 'unknown', evidence: caps?.serverTools ? '已声明，待实际调用。' : '宿主未声明。' };
    this.probe.features.draft = { state: 'unsupported', evidence: '当前 SDK 仅允许立即发送，不支持写入草稿；选区使用模型上下文附件或复制。' };
    return initialCanvasId;
  }
  private async renewSession(canvasId?: string) {
    if (!this.reconnecting) {
      this.reconnecting = (async () => {
        const result = await this.app!.callServerTool({ name: 'canvas_connect', arguments: canvasId ? { canvasId } : {} });
        const token = (result._meta as { uiSession?: string } | undefined)?.uiSession;
        if (result.isError || !token) throw new Error('宿主未能恢复画布会话，请重新打开 Canvas 面板。');
        this.session = token;
      })().finally(() => { this.reconnecting = undefined; });
    }
    await this.reconnecting;
  }
  private applyDisplayMode(mode: string) {
    this.displayMode = mode;
    this.probe.features.panel = { state: mode === 'fullscreen' ? 'supported' : 'unknown', evidence: `宿主返回 displayMode=${mode}；具体展示位置由宿主控制。` };
    this.onDisplay?.();
  }
  async openPanel() {
    if (!this.app?.getHostContext()?.availableDisplayModes?.includes('fullscreen')) throw new Error('宿主未声明可展开的原生面板，请使用宿主面板入口或浏览器预览。');
    const result = await this.app.requestDisplayMode({ mode: 'fullscreen' });
    this.applyDisplayMode(result.mode);
    if (result.mode !== 'fullscreen') throw new Error('宿主未切换到扩展面板，当前保留内嵌视图。');
  }
  get canAttach() { return Boolean(this.extensions?.modelContext || this.app?.getHostCapabilities()?.updateModelContext); }
  get canSend() { return Boolean(this.extensions?.message || this.app?.getHostCapabilities()?.message); }
  call<T = any>(op: string, args: Record<string, unknown> = {}): Promise<T> {
    // The server session has one active artifact. Keep reads, state writes and
    // reconnects ordered even when navigation and background refresh overlap.
    const result = this.callQueue.then(() => this.callNow<T>(op, args));
    this.callQueue = result.catch(() => {});
    return result;
  }
  private async callNow<T>(op: string, args: Record<string, unknown>): Promise<T> {
    if (!this.session) throw new Error('等待宿主发送画布绑定。请重新调用 canvas_probe 或 canvas_open。');
    if (this.app) {
      const session = this.session;
      let result = await this.app.callServerTool({ name: 'canvas_ui', arguments: { session, op, args } });
      const invalidSession = result.isError && result.content.some(c => {
        if (c.type !== 'text') return false;
        try { return JSON.parse(c.text).code === 'INVALID_SESSION'; } catch { return false; }
      });
      if (invalidSession) {
        // INVALID_SESSION is rejected before any operation executes. Retry it
        // once after reconnecting; never replay writes on transport/other errors.
        if (this.session === session) await this.renewSession(this.canvasId);
        result = await this.app.callServerTool({ name: 'canvas_ui', arguments: { session: this.session, op, args } });
      }
      if (result.isError) throw new Error(result.content.map(c => c.type === 'text' ? c.text : '').join('\n'));
      const data = result.structuredContent as { manifest?: { canvasId?: string } } | undefined;
      if (data?.manifest?.canvasId && ['read', 'publish', 'update', 'openFile', 'example'].includes(op)) this.canvasId = data.manifest.canvasId;
      if (op === 'delete' && args.canvasId === this.canvasId) this.canvasId = undefined;
      this.probe.features.serverTools = { state: 'supported', evidence: 'canvas_ui 调用成功。' };
      return result.structuredContent as T;
    }
    const response = await fetch('/api/ui', { method: 'POST', headers: { Authorization: `Bearer ${this.session}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ op, args }) });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message), { code: data.code });
    return data as T;
  }
  async addContext(text: string) {
    if (!this.app || !this.canAttach) throw new Error('宿主未声明模型上下文能力，请复制上下文。');
    try {
      const params = { content: [{ type: 'text' as const, text }] };
      if (this.extensions?.modelContext) await this.extensions.modelContext.update(params);
      else await this.app.updateModelContext(params);
      this.probe.features.modelContext = { state: 'supported', evidence: '用户按钮调用成功。' };
    }
    catch (e) { this.probe.features.modelContext = { state: 'unsupported', evidence: String(e) }; throw e; }
  }
  async send(text: string) {
    if (!this.app || !this.canSend) throw new Error('宿主未声明消息能力，请复制上下文。');
    try {
      const params = { role: 'user' as const, content: [{ type: 'text' as const, text }] };
      if (this.extensions?.message) await this.extensions.message.send({ ...params, _meta: { 'openai/message': { target: 'active', send: true } } });
      else await this.app.sendMessage(params);
      this.probe.features.message = { state: 'supported', evidence: '明确发送按钮调用成功。' };
    }
    catch (e) { this.probe.features.message = { state: 'unsupported', evidence: String(e) }; throw e; }
  }
}
