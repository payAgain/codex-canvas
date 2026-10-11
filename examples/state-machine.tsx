import { Stack, Row, H1, Text, Pill, Button, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

// A conceptual state view derived from publish(), not an enum in the implementation.
const paths = [
  { id: 'first', label: '首次成功', source: 1, published: 1, state: 'ready', edges: ['start', 'success'], detail: '第一次发布成功，保存 r1 源码和构建，两个版本号都指向 r1。' },
  { id: 'failed', label: '更新失败', source: 2, published: 1, state: 'diagnostics', edges: ['update', 'failure'], detail: 'r2 源码已保存，但编译失败。诊断可供修复，画面继续使用 r1。' },
  { id: 'fixed', label: '修复成功', source: 3, published: 3, state: 'ready', edges: ['retry', 'success'], detail: '修复后产生 r3 源码；构建成功后发布 r3，r2 失败记录仍保留。' },
];

export default function PublishStates() {
  const t = useHostTheme();
  const [step, setStep] = useCanvasState('publishStates.step', 'failed');
  const current = paths.find(p => p.id === step) ?? paths[1]!;
  const nodes = [
    { id: 'empty', x: 14, y: 158, w: 176, title: '尚无成功构建', sub: 'publishedRevision: null' },
    { id: 'compiling', x: 328, y: 158, w: 220, title: '编译本次源码', sub: 'sourceRevision 递增' },
    { id: 'ready', x: 718, y: 46, w: 204, title: '发布成功', sub: '源码与构建版本一致' },
    { id: 'diagnostics', x: 718, y: 278, w: 204, title: '保留诊断', sub: '沿用最近成功构建' },
  ];
  const edges = [
    { id: 'start', d: 'M190 198H320', x: 250, y: 184, label: 'publish' },
    { id: 'success', d: 'M548 180H617V86H710', x: 657, y: 105, label: '编译通过' },
    { id: 'failure', d: 'M548 216H617V318H710', x: 657, y: 305, label: '编译失败' },
    { id: 'update', d: 'M718 67H438V150', x: 525, y: 54, label: '提交更新' },
    { id: 'retry', d: 'M718 342H438V246', x: 533, y: 365, label: '修复后重试' },
  ];
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>失败的源码，不覆盖成功的画面</H1><Pill size="sm">状态转换图</Pill></Row>
    <Row justify="space-between" wrap gap={12}><Text tone="secondary">沿着一次发布、一次失败和一次修复，理解两个版本号。</Text><Row gap={6}>{paths.map(p => <Button key={p.id} variant={p.id === current.id ? 'primary' : 'ghost'} onClick={() => setStep(p.id)}>{p.label}</Button>)}</Row></Row>
    <div style={{ overflowX: 'auto' }} data-canvas-part="publish-states">
      <svg viewBox="0 0 940 390" role="img" aria-label={`发布状态转换：${current.label}`} style={{ width: '100%', minWidth: 700, display: 'block', fontFamily: 'inherit' }}>
        <defs>{[['muted', t.stroke.primary], ['active', t.accent.primary]].map(([id, color]) => <marker key={id} id={`state-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill={color} /></marker>)}</defs>
        {edges.map(e => { const active = current.edges.includes(e.id); return <g key={e.id}>
          <path d={e.d} fill="none" stroke={active ? t.accent.primary : t.stroke.primary} strokeWidth={active ? 2 : 1} markerEnd={`url(#state-${active ? 'active' : 'muted'})`} />
          <text x={e.x} y={e.y} textAnchor="middle" fill={active ? t.accent.primary : t.text.tertiary} fontSize={12}>{e.label}</text>
        </g>; })}
        {nodes.map(n => <g key={n.id}>
          <rect x={n.x} y={n.y} width={n.w} height={80} rx={16} fill={n.id === current.state ? t.fill.secondary : t.bg.editor} stroke={n.id === current.state ? t.accent.primary : t.stroke.primary} strokeWidth={n.id === current.state ? 2 : 1} />
          <text x={n.x + n.w / 2} y={n.y + 34} textAnchor="middle" fill={t.text.primary} fontSize={15} fontWeight={600}>{n.title}</text>
          <text x={n.x + n.w / 2} y={n.y + 57} textAnchor="middle" fill={t.text.secondary} fontSize={11}>{n.sub}</text>
        </g>)}
        <text x={14} y={298} fill={t.text.tertiary} fontSize={12}>强调线：当前情景经过的路径</text>
        <text x={14} y={320} fill={t.text.tertiary} fontSize={12}>状态按发布结果推导，并非实现中的 enum</text>
      </svg>
    </div>
    <Row gap={28} wrap style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 16 }}>
      <Stack gap={4}><Text size="small" tone="tertiary">SOURCE REVISION</Text><Text weight="medium" style={{ fontSize: 22, fontFamily: 'monospace' }}>r{current.source}</Text></Stack>
      <Stack gap={4}><Text size="small" tone="tertiary">PUBLISHED REVISION</Text><Text weight="medium" style={{ fontSize: 22, fontFamily: 'monospace', color: t.accent.primary }}>r{current.published}</Text></Stack>
      <Text tone="secondary" style={{ flex: '1 1 300px' }}>{current.detail}</Text>
    </Row>
    <Text size="small" tone="tertiary">来源：packages/runtime/src/store.ts · r1 → r2 → r3 为行为示意。首次编译失败时尚无成功画面；删除 / 恢复是独立维度，未画入本图。</Text>
  </Stack>;
}
