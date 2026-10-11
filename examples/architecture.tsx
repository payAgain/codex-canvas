import { Stack, Row, Grid, H1, H2, Text, Pill, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

// Architectural overview of this repository; arrows show logical relationships.
const nodes = [
  { id: 'agent', title: '对话与生成', label: 'Codex + Canvas Skill', x: 10, y: 32, detail: '根据用户需求编写单文件 TSX，使用项目 SDK，把源码交给 Canvas 工具。', boundary: '生成与修改由明确的用户请求驱动。' },
  { id: 'mcp', title: 'MCP 服务', label: 'Tools · Sessions · Resources', x: 320, y: 32, detail: '提供发布、读取、更新和画布管理工具，并绑定当前界面与画布身份。', boundary: '不同界面使用独立会话与明确的画布 ID。' },
  { id: 'runtime', title: '编译与版本', label: 'TypeScript + esbuild', x: 630, y: 32, detail: '检查导入和类型，构建浏览器代码，保存源码与成功构建。失败时保留最近可用版本。', boundary: 'Node 只编译和存储，不执行生成的 React 模块。' },
  { id: 'view', title: '隔离画布', label: 'React + Canvas SDK', x: 10, y: 210, detail: '在 sandbox iframe 中执行生成视图，使用 SDK 组件、图表和持久状态 Hook。', boundary: '没有 Node、服务令牌或宿主桥接对象。' },
  { id: 'shell', title: '可信工作台', label: 'UI + Host bridge', x: 320, y: 210, detail: '展示画布、诊断与选区，协调状态保存；用户明确操作时才调用宿主消息能力。', boundary: '浏览器回退和原生 MCP App 共用工作台。' },
  { id: 'store', title: '本地存储', label: 'Source · Builds · State', x: 630, y: 210, detail: '按工作区与画布保存源码、构建、交互状态和选区反馈，通过版本检查处理写入冲突。', boundary: '存储独立于插件缓存，仍需自行备份。' },
];

export default function Architecture() {
  const theme = useHostTheme();
  const [selected, setSelected] = useCanvasState('selectedModule', 'runtime');
  const node = nodes.find(item => item.id === selected) ?? nodes[2]!;
  const edge = { stroke: theme.stroke.primary, strokeWidth: 2, fill: 'none', markerEnd: 'url(#architecture-arrow)' };
  return <Stack gap={22} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row gap={12}><H1>从对话到交互画布</H1><Pill size="sm">系统架构</Pill></Row>
    <Text tone="secondary">生成、编译、展示和存储各司其职。点击模块查看职责与边界。</Text>
    <svg viewBox="0 0 900 326" role="group" aria-label="Codex Canvas 架构图" style={{ display: 'block', width: '100%', fontFamily: 'inherit' }}>
      <defs><marker id="architecture-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill={theme.stroke.primary} /></marker></defs>
      <path d="M270 74H312" {...edge} /><path d="M580 74H622" {...edge} />
      <path d="M450 116V202" {...edge} /><path d="M760 116V202" {...edge} />
      <path d="M320 252H278" {...edge} /><path d="M580 252H622" {...edge} />
      <text x="465" y="165" fill={theme.text.tertiary} fontSize="12">打开 / 绑定</text><text x="774" y="165" fill={theme.text.tertiary} fontSize="12">保存版本</text>
      {nodes.map(item => <g key={item.id} role="button" tabIndex={0} aria-label={item.title} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item.id); } }} style={{ cursor: 'pointer' }}>
        <rect x={item.x} y={item.y} width="260" height="84" rx="8" fill={selected === item.id ? theme.fill.secondary : theme.bg.editor} stroke={selected === item.id ? theme.accent.primary : theme.stroke.primary} strokeWidth={selected === item.id ? 2 : 1} />
        <text x={item.x + 18} y={item.y + 33} fill={theme.text.primary} fontSize="17" fontWeight="600">{item.title}</text>
        <text x={item.x + 18} y={item.y + 60} fill={theme.text.secondary} fontSize="12">{item.label}</text>
      </g>)}
    </svg>
    <Grid columns="repeat(auto-fit, minmax(min(100%, 280px), 1fr))" gap={24}>
      <Stack gap={8}><H2>{node.title}</H2><Text tone="secondary">{node.detail}</Text></Stack>
      <Stack gap={8}><H2>设计边界</H2><Text tone="secondary">{node.boundary}</Text></Stack>
    </Grid>
    <Text tone="tertiary" size="small">箭头表示逻辑关系；工作台经服务保存状态，不直接访问文件。模块选择会保存，点击不触发 AI 请求。</Text>
  </Stack>;
}
