import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';

export function userDataDirectory(platform = process.platform, home = homedir(), env = process.env) {
  if (platform === 'win32') return path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'CodexCanvas');
  if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', 'CodexCanvas');
  const xdg = env.XDG_DATA_HOME;
  return path.join(xdg && path.isAbsolute(xdg) ? xdg : path.join(home, '.local', 'share'), 'codex-canvas');
}

export async function dataDirectory(root: string, explicit?: string) {
  if (explicit || process.env.CANVAS_DATA_DIR) return path.resolve(explicit ?? process.env.CANVAS_DATA_DIR!);
  try {
    const config = JSON.parse(await readFile(path.join(root, 'canvas-config.json'), 'utf8'));
    if (typeof config.dataDirectory === 'string' && path.isAbsolute(config.dataDirectory)) return config.dataDirectory;
    if (config.storage === 'user') return userDataDirectory();
  } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
  return path.join(root, '.canvas-data');
}
