import { Stack, Row, H1, Text, Pill, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

const classes = [
  { id: 'service', name: 'CanvasService', x: 4, y: 28, width: 292, fields: ['+ store: CanvasStore', '+ files: CanvasFiles', '+ sessions: Map'], methods: ['+ bind(canvasId?)', '+ call(token, op, raw)'], file: 'packages/mcp-server/src/service.ts', detail: '构造函数接收 CanvasStore，并创建一个 CanvasFiles 实例。负责会话与操作分发，不持有生成视图。' },
  { id: 'files', name: 'CanvasFiles', x: 622, y: 28, width: 292, fields: ['− store: CanvasStore', '− syncing: boolean', '+ errors: Map'], methods: ['+ open(path, title?, watch?)', '+ sync()'], file: 'packages/runtime/src/files.ts', detail: '接收已有 Store；规范化本地文件路径、跟随文件并调用 store.publish。原始文件不会被改写。' },
  { id: 'store', name: 'CanvasStore', x: 302, y: 232, width: 330, fields: ['+ dataRoot: string', '+ projectRoot: string'], methods: ['+ publish(title, source, ...)', '+ read(id, revision?, includeBuild?)', '+ setState(id, baseRevision, key, value)'], file: 'packages/runtime/src/store.ts', detail: '由服务和文件入口共同引用，负责编译、版本与持久化；这里不存在继承关系。成员和参数为节选。' },
];

export default function ClassDiagram() {
  const t = useHostTheme();
  const [focus, setFocus] = useCanvasState('classes.focus', 'service');
  const selected = classes.find(c => c.id === focus) ?? classes[0]!;
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>服务、文件入口与存储</H1><Pill size="sm">UML 类图</Pill></Row>
    <Text tone="secondary">三个真实类，一份共享 Store。实心菱形表示创建并持有，箭头表示单向引用。</Text>
    <div style={{ overflowX: 'auto' }} data-canvas-part="class-model">
      <svg viewBox="0 0 920 430" role="group" aria-label="CanvasService、CanvasFiles 和 CanvasStore 类图" style={{ width: '100%', minWidth: 680, display: 'block', fontFamily: 'inherit' }}>
        <defs><marker id="uml-reference" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto"><path d="M2 1L10 6L2 11" fill="none" stroke={t.text.secondary} strokeWidth={1.5} /></marker></defs>
        <path d="M296 94L305 89L314 94L305 99Z" fill={t.text.secondary} />
        <path d="M314 94H614" stroke={t.text.secondary} markerEnd="url(#uml-reference)" />
        <text x={463} y={77} textAnchor="middle" fill={t.text.primary} fontSize={12}>创建并持有 files</text>
        <text x={326} y={116} fill={t.text.tertiary} fontSize={11}>1</text><text x={600} y={116} fill={t.text.tertiary} fontSize={11}>1</text>
        <path d="M150 218V302H294" fill="none" stroke={t.text.secondary} markerEnd="url(#uml-reference)" />
        <text x={161} y={280} fill={t.text.secondary} fontSize={12}>store · 注入</text>
        <path d="M768 218V302H640" fill="none" stroke={t.text.secondary} markerEnd="url(#uml-reference)" />
        <text x={758} y={280} textAnchor="end" fill={t.text.secondary} fontSize={12}>store · 引用</text>
        {classes.map(c => <g key={c.id} role="button" tabIndex={0} aria-label={c.name} aria-pressed={selected.id === c.id} onClick={() => setFocus(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFocus(c.id); } }} style={{ cursor: 'pointer' }}>
          <rect x={c.x} y={c.y} width={c.width} height={190} rx={5} fill={t.bg.editor} stroke={selected.id === c.id ? t.accent.primary : t.stroke.primary} strokeWidth={selected.id === c.id ? 1.8 : 1} />
          <rect x={c.x + 1} y={c.y + 1} width={c.width - 2} height={39} rx={4} fill={t.fill.secondary} />
          <path d={`M${c.x} ${c.y + 40}H${c.x + c.width}M${c.x} ${c.y + 40 + c.fields.length * 24 + 9}H${c.x + c.width}`} stroke={t.stroke.primary} />
          <text x={c.x + c.width / 2} y={c.y + 26} textAnchor="middle" fill={t.text.primary} fontSize={15} fontWeight={600} fontFamily="monospace">{c.name}</text>
          {c.fields.map((line, i) => <text key={line} x={c.x + 14} y={c.y + 63 + i * 24} fill={t.text.secondary} fontSize={12} fontFamily="monospace">{line}</text>)}
          {c.methods.map((line, i) => <text key={line} x={c.x + 14} y={c.y + 72 + c.fields.length * 24 + i * 24} fill={t.text.primary} fontSize={11} fontFamily="monospace">{line}</text>)}
        </g>)}
        <text x={4} y={400} fill={t.text.tertiary} fontSize={11}>+ public</text><text x={4} y={422} fill={t.text.tertiary} fontSize={11}>− private</text>
      </svg>
    </div>
    <div style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 14 }} data-canvas-part="class-detail"><Row gap={16} wrap><Text weight="medium">{selected.name}</Text><Text tone="secondary">{selected.detail}</Text></Row><Text size="small" tone="tertiary" style={{ marginTop: 6 }}>来源：{selected.file} · 类名、可见性与关系对应源码；方法签名经过缩写。</Text></div>
  </Stack>;
}
