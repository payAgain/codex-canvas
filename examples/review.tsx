import { Stack, Row, Grid, H1, H2, Table, Text, Code, Pill, Stat, Button, useCanvasState } from '@codex-canvas/sdk';
// Hypothetical review findings, not unresolved bugs in this project.
const findings = [
  { id: 'r1', level: 'P1', title: '失败构建替换可用画面', file: 'publish.ts', detail: '发布流程应先完成编译，再切换成功构建引用。编译失败只保存源码和诊断。', fix: 'if (result.ok) { activeBuild = result.build; }' },
  { id: 'r2', level: 'P1', title: '并发编辑覆盖新版本', file: 'store.ts', detail: '更新应携带 baseRevision。版本不一致时先读取新源码，再合并修改。', fix: 'assert(baseRevision === current.sourceRevision);' },
  { id: 'r3', level: 'P2', title: '不同画布复用了筛选状态', file: 'state.ts', detail: '按工作区与画布身份隔离状态。筛选只保存本地状态，不发送消息。', fix: 'const key = workspaceId + ":" + canvasId;' },
  { id: 'r4', level: 'P2', title: '错误提示缺少操作建议', file: 'editor.tsx', detail: '展示具体错误与恢复路径，帮助用户修复后重新提交。', fix: 'showError({ message, action: "修复后重新发布" });' },
];
export default function Review() {
  const [severity, setSeverity] = useCanvasState('reviewSeverity', '全部');
  const [selected, setSelected] = useCanvasState('finding', 'r1');
  const visible = severity === '全部' ? findings : findings.filter(item => item.level === severity);
  const finding = visible.find(item => item.id === selected) ?? visible[0]!;
  return <Stack gap={20} style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
    <Row gap={12}><H1>发布流程 · 代码审查</H1><Pill size="sm">演示案例</Pill></Row>
    <Text tone="secondary">先处理可能造成覆盖和丢失的问题，再补齐状态隔离与错误提示。</Text>
    <Grid columns={3} gap={16}><Stat label="审查发现" value={findings.length} /><Stat label="P1 · 优先处理" value={findings.filter(item => item.level === 'P1').length} /><Stat label="P2 · 后续改进" value={findings.filter(item => item.level === 'P2').length} /></Grid>
    <Row gap={8}>{['全部', 'P1', 'P2'].map(level => <Pill key={level} active={severity === level} onClick={() => setSeverity(level)}>{level}</Pill>)}</Row>
    <Table framed headers={['级别', '发现 · 点击查看', '涉及文件']} rows={visible.map(item => [<Pill size="sm" tone={item.level === 'P1' ? 'warning' : 'neutral'}>{item.level}</Pill>, <Button variant="ghost" onClick={() => setSelected(item.id)}>{item.title}</Button>, item.file])} />
    <div data-canvas-part="finding"><Stack gap={10}><H2>{finding.title}</H2><Text tone="secondary">{finding.detail}</Text><Code>{finding.fix}</Code></Stack></div>
    <Text tone="tertiary" size="small">虚构发现与伪代码，仅展示审查内容如何组织，不代表本项目仍有这些缺陷。可在 Design mode 选择一项，继续提出修改要求。</Text>
  </Stack>;
}
