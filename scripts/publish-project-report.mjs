import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = ['sdk', 'renderer', 'runtime', 'mcp-server', 'host-bridge'];
const rows = [];
for (const name of modules) {
  const directory = path.join(root, 'packages', name, 'src');
  const files = (await readdir(directory, { recursive: true })).filter(file => /\.(ts|tsx|css|html)$/.test(file));
  let lines = 0, bytes = 0;
  for (const file of files) { const content = await readFile(path.join(directory, file)); bytes += content.length; lines += content.toString('utf8').trimEnd().split(/\r?\n/).length; }
  rows.push({ name, files: files.length, lines, bytes });
}
const stamp = new Date().toISOString();
const source = `import { Page, Section, Grid, Card, CardBody, Stat, BarChart, Table, Select, Text, useCanvasState } from '@codex-canvas/sdk';
const rows = ${JSON.stringify(rows, null, 2)};
export default function ProjectReport() {
  const [metric, setMetric] = useCanvasState('metric', 'lines');
  const field = metric === 'files' ? 'files' : 'lines';
  return <Page title="从规划，到一张可用的画布。" subtitle="来源：当前仓库 packages/*/src · 采集时间：${stamp}">
    <Section title="本项目源码快照"><Grid columns="repeat(auto-fit, minmax(160px, 1fr))" gap={16}>
      <Card><CardBody><Stat label="独立模块" value={rows.length} /></CardBody></Card>
      <Card><CardBody><Stat label="源文件 / 个" value={rows.reduce((n, r) => n + r.files, 0)} tone="success" /></CardBody></Card>
      <Card><CardBody><Stat label="源码 / 行" value={rows.reduce((n, r) => n + r.lines, 0)} /></CardBody></Card>
    </Grid></Section>
    <Section title="实现分布"><Select value={metric} onChange={setMetric} options={[{ value: 'lines', label: '代码行数' }, { value: 'files', label: '文件数量' }]} />
      <BarChart categories={rows.map(r => r.name)} series={[{ name: field === 'files' ? '文件 / 个' : '源码 / 行', data: rows.map(r => r[field]), tone: 'success' }]} height={280} />
    </Section>
    <Section title="可追溯的原始数据"><Table headers={['模块', '文件 / 个', '源码 / 行', '大小 / KB']} rows={rows.map(r => [r.name, r.files, r.lines, (r.bytes / 1024).toFixed(1)])} /></Section>
    <Text tone="secondary" size="small">只统计自有源码中的 TS、TSX、CSS 与 HTML。排除依赖、研究副本和构建文件。行数不代表质量或测试覆盖率。运行 pnpm demo 可重新采集。</Text>
  </Page>;
}
`;
await mkdir(path.join(root, '.local'), { recursive: true });
const file = path.join(root, '.local/project-report.tsx'); await writeFile(file, source);
const cli = path.join(root, 'dist/cli.mjs');
const saved = JSON.parse(execFileSync(process.execPath, [cli, 'list'], { cwd: root, encoding: 'utf8' }));
const existing = saved.find(item => item.title === 'Codex Canvas · 项目源码报告');
const args = existing ? ['update', existing.canvasId, file, '--base', String(existing.sourceRevision)] : ['publish', file, '--title', 'Codex Canvas · 项目源码报告'];
execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: 'inherit' });
