import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { runtimePackage } from './release-config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const pkg = await readJson('package.json'); const renderer = await readJson('packages/renderer/package.json');
const runtime = runtimePackage(pkg, renderer); const lock = await readJson('release/package-lock.json');
assert.equal(pkg.license, 'MIT'); assert.equal(lock.version, pkg.version);
assert.deepEqual(lock.packages[''].dependencies, runtime.dependencies);
for (const name of ['plugin.json', '.codex-plugin/plugin.json']) assert.equal((await readJson(name)).version, pkg.version);
for (const file of ['LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', '.github/workflows/ci.yml', 'dist/server.mjs', 'dist/app.html']) await access(path.join(root, file));
const html = await readFile(path.join(root, 'dist/app.html'), 'utf8'); assert.ok(html.includes(`data-version="${pkg.version}"`));
const files = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))];
const forbidden = /(^|\/)(node_modules|\.canvas-data|\.local|canvas-research-20261010|\.env)(\/|$)/;
const secrets = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bsk-[A-Za-z0-9_-]{30,}\b/, /#session=[a-f0-9]{40,}/, /[A-Za-z]:[\\/]Users[\\/][^\\/\s]+[\\/]/];
for (const file of files) {
  assert.ok(!forbidden.test(file), `Private/generated file in Git content: ${file}`);
  if (!/\.(?:md|json|[cm]?js|tsx?|html|ya?ml|ps1)$/.test(file)) continue;
  const text = await readFile(path.join(root, file), 'utf8');
  for (const rule of secrets) assert.ok(!rule.test(text), `Potential credential or personal path in ${file}`);
  if (file.endsWith('.md')) {
    const markdown = text.replace(/```[\s\S]*?```|`[^`\n]*`/g, '');
    for (const match of markdown.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^(?:https?:|mailto:|#)/.test(target)) continue;
      assert.ok(!path.isAbsolute(target), `Absolute documentation link in ${file}`);
      await access(path.resolve(root, path.dirname(file), decodeURIComponent(target))).catch(() => { throw new Error(`Broken local link in ${file}: ${target}`); });
    }
  }
}
console.log(`Release ${pkg.version}: manifests, runtime lock, documentation links and ${files.length} Git candidate paths checked. No matching private data or credential patterns found.`);
