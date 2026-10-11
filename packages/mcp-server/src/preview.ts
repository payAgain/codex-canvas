import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

// The background service renders in a browser. This helper only starts the
// trusted server and hands out a separate authenticated view for each open.
export async function openPreview(root: string, dataRoot: string, filePath?: string, title?: string, watch = true) {
  const readyFile = path.join(dataRoot, 'preview-1.1.0.json');
  async function connect() {
    const ready = JSON.parse(await readFile(readyFile, 'utf8'));
    if (ready.version !== '1.1.0') throw new Error('预览服务版本不匹配。');
    const url = new URL(ready.previewUrl);
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') throw new Error('预览服务地址无效。');
    const request = async (route: string, token: string, data: unknown) => {
      const response = await fetch(`${url.origin}${route}`, { method: 'POST', signal: AbortSignal.timeout(route === '/api/bootstrap' ? 2000 : 120000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message ?? '预览服务连接失败。');
      return result;
    };
    const token = new URLSearchParams(url.hash.slice(1)).get('session')!;
    const binding = await request('/api/bootstrap', token, {});
    return { url, request, session: binding.session as string };
  }
  let connection;
  try { connection = await connect(); } catch {
    const child = spawn(process.execPath, [path.join(root, 'dist/server.mjs'), '--serve', '--port', '0', '--data-dir', dataRoot, '--ready-file', readyFile],
      { cwd: root, detached: true, windowsHide: true, stdio: 'ignore' });
    let startupError: Error | undefined;
    child.on('error', error => { startupError = error; }); child.unref();
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (startupError) throw startupError;
      await new Promise(resolve => setTimeout(resolve, 250));
      try { connection = await connect(); break; } catch { /* waiting for ready file */ }
    }
    if (!connection) throw new Error('无法启动预览服务。请运行 node dist/server.mjs --serve 查看错误。');
  }
  const result = filePath ? await connection.request('/api/ui', connection.session, { op: 'openFile', args: { path: path.resolve(filePath), title, watch } }) : {};
  return { ...result, previewUrl: `${connection.url.origin}/#session=${connection.session}` };
}
