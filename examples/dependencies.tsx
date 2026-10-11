import { Stack, Row, H1, Text, Pill, Button, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

const nodes = [
  { id: 'server', x: 8, y: 72, name: 'mcp-server', sub: '服务入口 + 工作台入口', detail: '服务入口依赖 runtime；工作台入口依赖 host-bridge。属于同一源码包，在两个环境分别构建。' },
  { id: 'runtime', x: 330, y: 72, name: 'runtime', sub: 'TypeScript · esbuild · node:fs', detail: '编译与文件存储只在 Node 服务中运行。构建时解析 SDK / renderer，不在 Node 执行生成的组件。' },
  { id: 'bridge', x: 330, y: 210, name: 'host-bridge', sub: 'MCP Apps · OpenAI extensions', detail: '宿主桥只进入可信工作台，不暴露给生成的 Canvas。OpenAI 扩展取决于宿主实际能力。' },
  { id: 'generated', x: 8, y: 348, name: 'generated TSX', sub: '唯一允许的导入：Canvas SDK', detail: '生成代码只通过 SDK 获得组件与 hooks，不能直接导入 React 包名、Node 或第三方渲染器。' },
  { id: 'sdk', x: 330, y: 348, name: 'sdk', sub: '组件契约 · hooks · 状态', detail: 'SDK 导出 renderer 组件和 React hooks，通过受控的消息通道持久化交互状态。' },
  { id: 'renderer', x: 652, y: 348, name: 'renderer', sub: 'cursor-canvas-web · Mantine', detail: '封装第三方组件、主题、挂载与 Design mode。对 runtime/contracts 的 PartSelection 引用仅为类型，在编译后擦除。' },
];

export default function Dependencies() {
  const t = useHostTheme();
  const [focus, select] = useCanvasState('dependencies.focus', 'sdk');
  const [showTypes, setShowTypes] = useCanvasState('dependencies.types', false);
  const active = nodes.find(n => n.id === focus) ?? nodes[4]!;
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>依赖有方向，边界才稳定</H1><Pill size="sm">模块依赖图</Pill></Row>
    <Row justify="space-between" wrap gap={12}><Text tone="secondary">箭头从使用方指向提供方；第三方组件集中在 renderer。</Text><Row gap={6}><Button variant={!showTypes ? 'primary' : 'ghost'} onClick={() => setShowTypes(false)}>运行时依赖</Button><Button variant={showTypes ? 'primary' : 'ghost'} onClick={() => setShowTypes(true)}>包含类型引用</Button></Row></Row>
    <div style={{ overflowX: 'auto' }} data-canvas-part="dependency-graph">
      <svg viewBox="0 0 940 436" role="group" aria-label="项目模块与依赖方向" style={{ width: '100%', minWidth: 700, display: 'block', fontFamily: 'inherit' }}>
        <defs><marker id="dep-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill={t.text.secondary} /></marker></defs>
        <path d="M8 174H916M8 312H916" stroke={t.stroke.primary} strokeDasharray="3 5" />
        <text x={8} y={56} fill={t.text.tertiary} fontSize={11}>NODE SERVICE</text><text x={8} y={198} fill={t.text.tertiary} fontSize={11}>TRUSTED UI</text><text x={8} y={336} fill={t.text.tertiary} fontSize={11}>SANDBOX VIEW</text>
        {['M240 110H322', 'M240 120H277V248H322', 'M240 386H322', 'M562 386H644'].map(d => <path key={d} d={d} fill="none" stroke={t.text.secondary} markerEnd="url(#dep-arrow)" />)}
        <text x={276} y={235} textAnchor="middle" fill={t.text.tertiary} fontSize={10}>UI</text>
        <text x={276} y={374} textAnchor="middle" fill={t.text.secondary} fontSize={10}>import</text>
        <text x={606} y={374} textAnchor="middle" fill={t.text.secondary} fontSize={10}>export</text>
        {showTypes && <g>
          <path d="M884 386H915V28H446V64" fill="none" stroke={t.accent.primary} strokeDasharray="5 4" markerEnd="url(#dep-arrow)" />
          <text x={674} y={19} textAnchor="middle" fill={t.accent.primary} fontSize={11}>import type · PartSelection（编译后擦除）</text>
          <text x={670} y={52} textAnchor="middle" fill={t.text.tertiary} fontSize={10}>shell 也引用 contracts 类型，图中省略</text>
        </g>}
        <text x={658} y={110} fill={t.text.secondary} fontSize={14}>编译不等于执行</text>
        <text x={658} y={132} fill={t.text.tertiary} fontSize={12}>Node 构建浏览器包，不运行用户组件。</text>
        <text x={658} y={246} fill={t.text.secondary} fontSize={14}>桥接不进入沙箱</text>
        <text x={658} y={268} fill={t.text.tertiary} fontSize={12}>视图不持有服务令牌或宿主 API。</text>
        {nodes.map(n => <g key={n.id} role="button" tabIndex={0} aria-label={n.name} aria-pressed={active.id === n.id} onClick={() => select(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); } }} style={{ cursor: 'pointer' }}>
          <rect x={n.x} y={n.y} width={232} height={76} rx={5} fill={active.id === n.id ? t.fill.secondary : t.bg.editor} stroke={active.id === n.id ? t.accent.primary : t.stroke.primary} />
          <text x={n.x + 15} y={n.y + 31} fill={t.text.primary} fontFamily="monospace" fontWeight={600} fontSize={15}>{n.name}</text>
          <text x={n.x + 15} y={n.y + 54} fill={t.text.secondary} fontSize={11}>{n.sub}</text>
        </g>)}
      </svg>
    </div>
    <div style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 14 }}><Row gap={16} wrap><Text weight="medium" style={{ fontFamily: 'monospace' }}>{active.name}</Text><Text tone="secondary">{active.detail}</Text></Row></div>
    <Text size="small" tone="tertiary">来源：packages/*/src 的静态导入与导出 · 关键依赖节选，非完整 npm 依赖树。切换类型引用可查看跨层类型共享。</Text>
  </Stack>;
}
