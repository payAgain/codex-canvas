import { readFile, mkdir, cp, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { CanvasStore } from '../../runtime/src/store.js';

export function userDataDirectory(platform = process.platform, home = homedir(), env = process.env) {
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'CodexCanvas');
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'CodexCanvas');
  const xdg = env.XDG_DATA_HOME;
  return path.join(xdg && path.isAbsolute(xdg) ? xdg : path.join(home, '.local', 'share'), 'codex-canvas');
}

export function pluginDataDirectory(home = homedir(), env = process.env) {
  const codexRoot = env.CODEX_HOME ? path.resolve(env.CODEX_HOME) : path.join(home, '.codex');
  return path.join(codexRoot, 'plugins', 'codex-canvas', 'data');
}

async function exists(file: string) {
  try { await access(file); return true; } catch (e: any) { if (e.code === 'ENOENT') return false; throw e; }
}

async function migrateLibrary(root: string, target: string) {
  if (await exists(target)) return;
  const legacy = (await Promise.all([userDataDirectory(), path.join(root, '.canvas-data')].map(async candidate =>
    await exists(path.join(candidate, 'workspace.json')) ? candidate : undefined))).find(Boolean);
  if (!legacy) return;
  const parent = path.dirname(target);
  await mkdir(parent, { recursive: true });
  // Serialize startup across MCP/CLI processes and take a consistent snapshot
  // under the old library's own write lock. The original remains a backup.
  await new CanvasStore(parent, root).lock(async () => {
    if (await exists(target)) return;
    const stage = path.join(parent, `.migration-${randomUUID()}`);
    try {
      await mkdir(stage);
      await new CanvasStore(legacy, root).lock(async () => {
        for (const item of ['workspace.json', 'canvases', 'preferences.json', 'probes']) {
          if (await exists(path.join(legacy, item))) await cp(path.join(legacy, item), path.join(stage, item), { recursive: true });
        }
      });
      await rename(stage, target);
    } finally { await rm(stage, { recursive: true, force: true }); }
  });
}

// Only the server-selected library folder can be revealed, never a UI-supplied
// command or arbitrary path. Called exclusively by an explicit user button.
export async function openLibraryFolder(directory: string) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [directory], { shell: false, stdio: 'ignore', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => code === 0 || (process.platform === 'win32' && code === 1)
      ? resolve() : reject(new Error('无法打开文件夹，可复制上方路径后在文件管理器中打开。')));
  });
}

export async function dataDirectory(root: string, explicit?: string) {
  if (explicit || process.env.CANVAS_DATA_DIR) return path.resolve(explicit ?? process.env.CANVAS_DATA_DIR!);
  try {
    const config = JSON.parse(await readFile(path.join(root, 'canvas-config.json'), 'utf8'));
    if (typeof config.dataDirectory === 'string' && path.isAbsolute(config.dataDirectory)) return config.dataDirectory;
  } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
  const directory = pluginDataDirectory();
  await migrateLibrary(root, directory);
  return directory;
}
