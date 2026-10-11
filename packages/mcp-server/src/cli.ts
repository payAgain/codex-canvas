import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CanvasStore } from '../../runtime/src/store.js';
import { CanvasError } from '../../runtime/src/contracts.js';
import { dataDirectory } from './settings.js';
import { openPreview } from './preview.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command, ...args] = process.argv.slice(2);
const option = (key: string) => { const index = args.indexOf(key); return index < 0 ? undefined : args[index + 1]; };
try {
  if (!command || command === 'help') {
    console.log('canvas open [FILE] --browser [--title TITLE] [--no-watch] | list [--deleted] | read ID [--revision N] | publish FILE [--title TITLE] | update ID FILE --base N [--title TITLE] | delete ID --base N | restore ID --base N\nIn Codex, open canvases with the native plugin tools. CLI open requires --browser to explicitly start a standalone browser preview. Delete is recoverable and keeps external source files. Optional: --data-dir PATH.');
  } else {
    if (command === 'open' && !args.includes('--browser')) throw new CanvasError('NATIVE_PANEL_REQUIRED', '请在 Codex 中通过 Codex Canvas 插件的 canvas_open_file 或 canvas_open 打开原生画布。独立浏览器预览必须显式加 --browser，不能作为插件打开失败时的自动回退。');
    const store = new CanvasStore(await dataDirectory(root, option('--data-dir')), root);
    await store.init(); let result: unknown;
    if (command === 'open') result = await openPreview(root, store.dataRoot, args[0]?.startsWith('--') ? undefined : args[0], option('--title'), !args.includes('--no-watch'));
    else if (command === 'list') result = await store.list(args.includes('--deleted'));
    else if (command === 'delete' || command === 'restore') result = await store.setDeleted(args[0]!, Number(option('--base')), command === 'delete');
    else if (command === 'read') result = await store.read(args[0]!, option('--revision') ? Number(option('--revision')) : undefined);
    else if (command === 'publish') result = await store.publish(option('--title') ?? path.basename(args[0] ?? 'Canvas'), await readFile(path.resolve(args[0]!), 'utf8'));
    else if (command === 'update') {
      const manifest = await store.manifest(args[0]!);
      result = await store.publish(option('--title') ?? manifest.title, await readFile(path.resolve(args[1]!), 'utf8'), args[0]!, Number(option('--base')));
    } else throw new Error('未知命令。运行 canvas help 查看用法。');
    console.log(JSON.stringify(result, null, 2));
    if (result && typeof result === 'object' && 'ok' in result && !result.ok) process.exitCode = 1;
  }
} catch (e: any) { console.error(JSON.stringify({ code: e.code ?? 'ERROR', message: e.message })); process.exitCode = 1; }
