import { readFile, readdir, lstat, mkdir, access, writeFile, rename, rm, appendFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = JSON.parse(await readFile(path.join(root, '.local/latest-release.json'), 'utf8'));
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
assert.equal(release.local, false, 'Machine-specific packages cannot be published.');
assert.equal(release.version, pkg.version, 'Build a new portable package for the current version.');
assert.match(release.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
const stageRoot = path.resolve(release.releaseRoot);
assert.ok(stageRoot.startsWith(path.join(root, '.local/releases') + path.sep), 'Unexpected staging directory.');
assert.equal(path.resolve(release.stage), path.join(stageRoot, 'plugins/codex-canvas'));
assert.deepEqual(JSON.parse(await readFile(path.join(release.stage, 'canvas-config.json'), 'utf8')), { storage: 'plugin' });
const forbidden = /(^|\/)(\.canvas-data|\.local|\.git|\.env|canvas-research-20261010)(\/|$)/;
const files = [];
async function collect(relative) {
  if (relative.split('/').includes('node_modules')) return;
  assert.ok(!forbidden.test(relative), `Private archive entry: ${relative}`);
  const file = path.join(stageRoot, relative), info = await lstat(file);
  assert.ok(!info.isSymbolicLink(), `Symlinks cannot be published: ${relative}`);
  if (info.isDirectory()) for (const name of (await readdir(file)).sort()) await collect(`${relative}/${name}`);
  else { assert.ok(info.isFile(), `Unexpected archive entry: ${relative}`); files.push(relative); }
}
// Select only distribution roots: never include internal release.json records.
for (const item of ['INSTALL.md', '.agents', 'plugins']) await collect(item);
const required = ['INSTALL.md', '.agents/plugins/marketplace.json', 'plugins/codex-canvas/LICENSE',
  'plugins/codex-canvas/dist/app.html', 'plugins/codex-canvas/dist/server.mjs', 'plugins/codex-canvas/package-lock.json'];
for (const file of required) assert.ok(files.includes(file), `Missing archive entry: ${file}`);
const outputDir = path.join(root, '.local/public', release.version);
await mkdir(outputDir, { recursive: true });
const name = `codex-canvas-${release.version}-portable.zip`;
const archive = path.join(outputDir, name), sums = path.join(outputDir, 'SHA256SUMS.txt');
for (const file of [archive, sums]) {
  try { await access(file); throw new Error(`Refusing to overwrite a release asset: ${file}`); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
}
if (process.platform === 'win32') {
  // PowerShell 7/.NET preserves the hidden marketplace and plugin manifests.
  execFileSync('pwsh', ['-NoProfile', '-File', path.join(root, 'scripts/archive-release.ps1')], { stdio: 'inherit' });
} else {
  const temp = path.join(outputDir, `.archive-${randomUUID()}.zip`);
  try {
    execFileSync('zip', ['-q', temp, '-@'], { cwd: stageRoot, input: files.join('\n') + '\n', encoding: 'utf8' });
    const entries = execFileSync('unzip', ['-Z1', temp], { encoding: 'utf8' }).trim().split('\n').sort();
    assert.deepEqual(entries, [...files].sort(), 'Archive contents differ from the distribution allowlist.');
    execFileSync('unzip', ['-tqq', temp], { stdio: 'pipe' });
    await rename(temp, archive);
    const sha = createHash('sha256').update(await readFile(archive)).digest('hex');
    await writeFile(sums, `${sha}  ${name}\n`, { flag: 'wx' });
  } finally { await rm(temp, { force: true }); }
}
const checksum = createHash('sha256').update(await readFile(archive)).digest('hex');
assert.equal(await readFile(sums, 'utf8'), `${checksum}  ${name}\n`);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `directory=${path.relative(root, outputDir).split(path.sep).join('/')}\n`);
console.log(JSON.stringify({ version: release.version, archive, checksum, entries: files.length }, null, 2));
