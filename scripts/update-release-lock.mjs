import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runtimePackage } from './release-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = path.join(root, '.local', 'release-lock');
await mkdir(work, { recursive: true }); await mkdir(path.join(root, 'release'), { recursive: true });
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const renderer = JSON.parse(await readFile(path.join(root, 'packages/renderer/package.json'), 'utf8'));
await writeFile(path.join(work, 'package.json'), JSON.stringify(runtimePackage(pkg, renderer), null, 2) + '\n');
try { await copyFile(path.join(root, 'release/package-lock.json'), path.join(work, 'package-lock.json')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: work, shell: process.platform === 'win32', windowsHide: true, stdio: 'inherit' });
if (result.status !== 0) throw new Error('Could not generate release dependency lock.');
await copyFile(path.join(work, 'package-lock.json'), path.join(root, 'release/package-lock.json'));
console.log('Updated release/package-lock.json');
