import { Stack, Row, H1, Text, Pill, Button, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

export default function PublishSequence() {
  const t = useHostTheme();
  const [outcome, setOutcome] = useCanvasState('publishSequence.outcome', 'success');
  const failed = outcome === 'failure';
  const columns = [80, 310, 550, 820];
  const participants = ['CanvasService', 'CanvasStore', 'compile()', '文件系统'];
  const messages = [
    { from: 0, to: 1, y: 100, label: 'publish(title, source)' },
    { from: 1, to: 3, y: 150, label: 'writeFile · source/<r>.tsx' },
    { from: 1, to: 2, y: 200, label: 'compile(source, root)' },
    { from: 2, to: 1, y: 252, label: failed ? 'diagnostics · 无 buildHash' : 'bundle + css + buildHash', response: true },
    ...(failed ? [] : [{ from: 1, to: 3, y: 302, label: 'atomicJson · builds/<hash>.json' }]),
    { from: 1, to: 3, y: 352, label: failed ? 'manifest · 新源码 + 旧发布版本' : 'manifest · 推进成功发布版本' },
    { from: 1, to: 0, y: 406, label: failed ? 'ok: false + diagnostics' : 'ok: true + manifest', response: true },
  ];
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>发布过程中，谁先做什么？</H1><Pill size="sm">时序图</Pill></Row>
    <Row justify="space-between" wrap gap={12}><Text tone="secondary">源码先落盘，编译结果再决定是否推进发布版本。</Text><Row gap={6}><Button variant={!failed ? 'primary' : 'ghost'} onClick={() => setOutcome('success')}>编译成功</Button><Button variant={failed ? 'primary' : 'ghost'} onClick={() => setOutcome('failure')}>编译失败</Button></Row></Row>
    <div style={{ overflowX: 'auto' }} data-canvas-part="publish-sequence">
      <svg viewBox="0 0 930 462" role="img" aria-label={`画布发布时序图：${failed ? '编译失败' : '编译成功'}`} style={{ width: '100%', minWidth: 680, display: 'block', fontFamily: 'inherit' }}>
        <defs><marker id="seq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill={t.text.secondary} /></marker></defs>
        {columns.map((x, i) => <g key={x}>
          <rect x={x - 72} y={8} width={144} height={40} rx={5} fill={t.fill.secondary} stroke={t.stroke.primary} />
          <text x={x} y={33} textAnchor="middle" fill={t.text.primary} fontSize={13} fontFamily="monospace">{participants[i]}</text>
          <path d={`M${x} 48V449`} stroke={t.stroke.primary} strokeDasharray="4 5" />
        </g>)}
        <rect x={304} y={98} width={12} height={312} fill={t.fill.secondary} stroke={t.stroke.primary} />
        <rect x={544} y={198} width={12} height={57} fill={t.fill.secondary} stroke={t.accent.primary} />
        <rect x={269} y={222} width={620} height={152} fill="none" stroke={t.stroke.primary} />
        <rect x={269} y={222} width={176} height={23} fill={t.bg.editor} stroke={t.stroke.primary} />
        <text x={280} y={238} fill={t.accent.primary} fontSize={11}>alt · {failed ? '[诊断非空]' : '[构建成功]'}</text>
        {messages.map(m => {
          const start = columns[m.from]!;
          const end = columns[m.to]!;
          const direction = end > start ? 1 : -1;
          return <g key={m.y}>
            <path d={`M${start + direction * 7} ${m.y}H${end - direction * 9}`} fill="none" stroke={t.text.secondary} strokeDasharray={m.response ? '5 4' : undefined} markerEnd="url(#seq-arrow)" />
            <text x={(start + end) / 2} y={m.y - 10} textAnchor="middle" fill={t.text.primary} fontSize={11}>{m.label}</text>
          </g>;
        })}
        {failed && <text x={594} y={305} textAnchor="middle" fill={t.text.secondary} fontSize={12}>跳过构建写入 · 保留上一版 buildHash</text>}
        <text x={310} y={447} textAnchor="middle" fill={t.text.tertiary} fontSize={11}>lock(callback) 覆盖整个写入阶段</text>
      </svg>
    </div>
    <div style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 14 }}><Row gap={16} wrap><Text weight="medium">{failed ? '失败也有可修复的源码版本' : '成功后交付新的浏览器构建'}</Text><Text tone="secondary">{failed ? 'sourceRevision 递增；publishedRevision 与 buildHash 沿用上一成功版本。' : 'sourceRevision 与 publishedRevision 指向这次提交；工作台读取 JS / CSS 后渲染。'}</Text></Row></div>
    <Text size="small" tone="tertiary">来源：CanvasService.call → CanvasStore.publish · 实线为调用，虚线为返回。省略文件锁 I/O、初始化 state.json 与临时文件 rename。</Text>
  </Stack>;
}
