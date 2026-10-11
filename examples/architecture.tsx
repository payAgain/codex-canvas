import { Stack, Row, H1, Text, Pill, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

// A source-derived runtime view, not a deployment or network topology.
const modules = [
  { id: 'mcp', name: 'CanvasService', detail: '校验会话与画布身份，分发发布、读取、状态和反馈请求。', path: 'packages/mcp-server/src/service.ts' },
  { id: 'runtime', name: 'Compiler', detail: '检查导入与类型，生成浏览器 JS / CSS。Node 不执行生成的 React 模块。', path: 'packages/runtime/src/compiler.ts' },
  { id: 'store', name: 'CanvasStore', detail: '保存源码尝试、成功构建与交互状态；编译失败保留最近成功版本。', path: 'packages/runtime/src/store.ts' },
  { id: 'shell', name: 'Trusted workbench', detail: '管理候选 iframe、编译诊断与 Design mode。普通交互不发送 AI 消息。', path: 'packages/mcp-server/src/ui/' },
  { id: 'bridge', name: 'HostBridge', detail: '适配 MCP Apps 与浏览器回退；只有明确的用户操作才请求宿主消息能力。', path: 'packages/host-bridge/src/index.ts' },
  { id: 'view', name: 'Generated canvas', detail: '在 sandbox iframe 中执行，只导入 Canvas SDK。没有 Node、服务令牌或宿主桥。', path: 'packages/sdk/src/index.tsx → packages/renderer/src/' },
];

export default function Architecture() {
  const t = useHostTheme();
  const [selected, select] = useCanvasState('selectedModule', 'runtime');
  const active = modules.find(m => m.id === selected) ?? modules[1]!;
  const ink = t.stroke.primary;
  function block(id: string, x: number, y: number, w: number, title: string, subtitle: string) {
    const chosen = active.id === id;
    return <g role="button" tabIndex={0} aria-label={title} aria-pressed={chosen} onClick={() => select(id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } }} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={62} rx={6} fill={chosen ? t.fill.secondary : t.bg.editor} stroke={chosen ? t.accent.primary : ink} />
      <text x={x + 16} y={y + 25} fill={t.text.primary} fontSize={15} fontWeight={600}>{title}</text>
      <text x={x + 16} y={y + 45} fill={t.text.secondary} fontSize={11}>{subtitle}</text>
    </g>;
  }
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>一份 TSX，三个运行边界</H1><Pill size="sm">系统架构</Pill></Row>
    <Text tone="secondary">服务编译与存储，工作台协调交互，隔离视图执行生成代码。</Text>
    <div style={{ overflowX: 'auto' }} data-canvas-part="runtime-architecture">
      <svg viewBox="0 0 960 376" role="group" aria-label="Codex Canvas 运行边界与数据流" style={{ display: 'block', width: '100%', minWidth: 700, fontFamily: 'inherit' }}>
        <defs><marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill={ink} /></marker></defs>
        {[{ x: 0, w: 280, title: 'LOCAL SERVICE', sub: 'Node · 可信服务' }, { x: 350, w: 260, title: 'WORKBENCH', sub: '浏览器 · 可信外壳' }, { x: 680, w: 280, title: 'CANVAS', sub: '浏览器 · 隔离执行' }].map(zone => <g key={zone.title}>
          <text x={zone.x + 16} y={20} fill={t.text.tertiary} fontSize={11} letterSpacing={1.4}>{zone.title}</text>
          <rect x={zone.x + 1} y={36} width={zone.w - 2} height={320} rx={8} fill={t.bg.editor} stroke={ink} strokeDasharray={zone.title === 'CANVAS' ? '5 4' : undefined} />
          <text x={zone.x + 16} y={62} fill={t.text.secondary} fontSize={12}>{zone.sub}</text>
        </g>)}
        {block('mcp', 16, 82, 248, 'CanvasService', 'MCP / HTTP · 会话与画布绑定')}
        {block('runtime', 16, 176, 248, 'Compiler', '导入策略 → TypeScript → esbuild')}
        {block('store', 16, 270, 248, 'CanvasStore', 'source/ · builds/ · state.json')}
        {['M140 144V168', 'M140 238V262'].map(d => <path key={d} d={d} fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />)}
        {block('bridge', 366, 82, 228, 'HostBridge', 'MCP Apps / 浏览器回退')}
        {block('shell', 366, 176, 228, 'Trusted workbench', '版本 · 诊断 · 选区 · 状态')}
        <path d="M480 144V168" fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />
        <path d="M270 112H358" fill="none" stroke={ink} markerStart="url(#arch-arrow)" markerEnd="url(#arch-arrow)" />
        <text x={314} y={100} textAnchor="middle" fill={t.text.secondary} fontSize={10}>工具调用</text>
        <path d="M264 207H358" fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />
        <text x={315} y={195} textAnchor="middle" fill={t.text.secondary} fontSize={10}>JS / CSS¹</text>
        {block('view', 696, 114, 248, 'Generated canvas', 'React · 用户生成的 TSX / JSX')}
        <path d="M594 206H640V145H688" fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />
        <text x={642} y={128} textAnchor="middle" fill={t.text.secondary} fontSize={10}>渲染</text>
        <path d="M820 176V203" fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />
        <text x={820} y={224} textAnchor="middle" fill={t.text.primary} fontSize={14} fontFamily="monospace">@codex-canvas/sdk</text>
        <path d="M820 234V250" fill="none" stroke={ink} markerEnd="url(#arch-arrow)" />
        <text x={820} y={272} textAnchor="middle" fill={t.text.secondary} fontSize={13}>Renderer · 组件 / 主题 / 选区</text>
        <path d="M696 302H480V246" fill="none" stroke={ink} strokeDasharray="4 4" markerEnd="url(#arch-arrow)" />
        <text x={566} y={291} textAnchor="middle" fill={t.text.secondary} fontSize={10}>状态 / 选区 · postMessage</text>
        <text x={820} y={329} textAnchor="middle" fill={t.text.tertiary} fontSize={11}>sandbox: allow-scripts</text>
        <text x={480} y={338} textAnchor="middle" fill={t.text.tertiary} fontSize={11}>宿主消息仅由用户明确触发</text>
      </svg>
    </div>
    <div style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 14 }} data-canvas-part="module-detail">
      <Row gap={16} wrap><Text weight="medium">{active.name}</Text><Text tone="secondary">{active.detail}</Text></Row>
      <Text size="small" tone="tertiary" style={{ marginTop: 6, fontFamily: 'monospace' }}>{active.path}</Text>
    </div>
    <Text size="small" tone="tertiary">源码视图 · 点击模块查看职责。¹ 构建经存储与服务读取交付，箭头表示逻辑数据流，不代表直接访问权限。</Text>
  </Stack>;
}
