import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { CanvasError } from '../../runtime/src/contracts.js';
import type { CanvasService } from './service.js';

async function body(request: IncomingMessage) {
  let size = 0; const parts: Buffer[] = [];
  for await (const chunk of request) { size += chunk.length; if (size > 512000) throw new CanvasError('BODY_LIMIT', '请求超过 512 KB。', 413); parts.push(chunk); }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { throw new CanvasError('INVALID_JSON', '请求不是合法 JSON。'); }
}
export async function serve(service: CanvasService, html: string, port: number) {
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    const host = request.headers.host;
    if (host !== `127.0.0.1:${(server.address() as any)?.port}`) { response.writeHead(403).end('Invalid host'); return; }
    const send = (code: number, data: unknown) => { response.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); response.end(JSON.stringify(data)); };
    try {
      if (request.method === 'GET' && request.url === '/') {
        response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-src 'self' about:; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(html); return;
      }
      if (request.method !== 'POST' || !['/api/bootstrap', '/api/ui'].includes(request.url ?? '')) { send(404, { message: 'Not found' }); return; }
      const origin = request.headers.origin;
      if (origin && origin !== service.baseUrl) throw new CanvasError('INVALID_ORIGIN', '拒绝跨站请求。', 403);
      if (!request.headers['content-type']?.startsWith('application/json')) throw new CanvasError('INVALID_TYPE', '需要 application/json。', 415);
      const token = request.headers.authorization?.replace(/^Bearer /, '') ?? '';
      const binding = service.binding(token);
      const data = await body(request);
      if (request.url === '/api/bootstrap') {
        const next = service.bind(binding.canvasId); send(200, { session: next.uiSession, canvasId: next.canvasId }); return;
      }
      send(200, await service.call(token, data.op, data.args ?? {}));
    } catch (error: any) { send(error.status ?? 400, { code: error.code ?? 'BAD_REQUEST', message: error.message }); }
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  service.baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
  return server;
}
