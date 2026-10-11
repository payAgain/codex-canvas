import { Stack, Row, H1, Text, Pill, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

const calls = [
  { id: 'entry', x: 4, y: 154, name: 'CanvasService.call()', sub: 'op = publish', file: 'packages/mcp-server/src/service.ts', detail: '解析 publishSchema，将标题和源码交给 store.publish；调用返回后绑定画布身份。' },
  { id: 'publish', x: 242, y: 154, name: 'CanvasStore.publish()', sub: '校验输入 · 分配版本', file: 'packages/runtime/src/store.ts', detail: '先校验标题和源码长度，再进入跨进程写锁。已有画布的更新还需要检查 baseRevision。' },
  { id: 'lock', x: 480, y: 154, name: 'lock(callback)', sub: '以下写入在锁内串行执行', file: 'packages/runtime/src/store.ts', detail: '锁保护整个发布过程；写入完成或抛出错误后，在 finally 中释放锁。' },
  { id: 'source', x: 728, y: 12, name: 'writeFile()', sub: '① 保存 source/<r>.tsx', file: 'packages/runtime/src/store.ts', detail: '编译之前先保存这次源码尝试。因此编译失败仍有可读、可修复的 sourceRevision。' },
  { id: 'compile', x: 728, y: 106, name: 'compile()', sub: '② 检查与构建', file: 'packages/runtime/src/compiler.ts', detail: '先检查导入策略，再进行 TypeScript 类型检查，最后用 esbuild 打包。任何前置检查失败都会提前返回诊断。' },
  { id: 'build', x: 728, y: 200, name: 'atomicJson(build)', sub: '③ 仅成功时写入构建', file: 'packages/runtime/src/store.ts', detail: '仅当 compile 返回 buildHash 时保存 bundle 和 CSS。失败时不生成可发布构建。' },
  { id: 'manifest', x: 728, y: 294, name: 'atomicJson(manifest)', sub: '④ 提交版本与诊断', file: 'packages/runtime/src/store.ts', detail: '更新 sourceRevision；成功时推进 publishedRevision，失败时沿用旧 publishedRevision 与 buildHash。新画布还会初始化 state.json。' },
];

export default function CallGraph() {
  const t = useHostTheme();
  const [selection, select] = useCanvasState('callGraph.focus', 'compile');
  const selected = calls.find(c => c.id === selection) ?? calls[4]!;
  const accent = t.accent.primary;
  return <Stack gap={16} style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <Row justify="space-between" wrap><H1>一次 publish，调用了什么？</H1><Pill size="sm">函数调用图</Pill></Row>
    <Text tone="secondary">从工作台入口追到写锁内的发布过程。点选函数，查看调用条件与代码位置。</Text>
    <div style={{ overflowX: 'auto' }} data-canvas-part="call-tree">
      <svg viewBox="0 0 940 440" role="group" aria-label="发布路径的函数调用图" style={{ width: '100%', minWidth: 700, display: 'block', fontFamily: 'inherit' }}>
        <defs>{[['normal', t.stroke.primary], ['active', accent]].map(([id, color]) => <marker key={id} id={`call-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill={color} /></marker>)}</defs>
        <text x={4} y={24} fontSize={11} fill={t.text.tertiary} letterSpacing={1}>ENTRY → PUBLISH → LOCK</text>
        <text x={4} y={47} fontSize={12} fill={t.text.secondary}>箭头：调用者 → 被调用者</text>
        {['M204 188H234', 'M442 188H472'].map(d => <path key={d} d={d} fill="none" stroke={accent} strokeWidth={1.5} markerEnd="url(#call-active)" />)}
        {calls.slice(3).map(c => <path key={c.id} d={`M680 188H703V${c.y + 34}H720`} fill="none" stroke={selected.id === c.id ? accent : t.stroke.primary} strokeWidth={selected.id === c.id ? 1.8 : 1} markerEnd={`url(#call-${selected.id === c.id ? 'active' : 'normal'})`} />)}
        {calls.map(c => <g key={c.id} role="button" tabIndex={0} aria-label={c.name + ' ' + c.sub} aria-pressed={selected.id === c.id} onClick={() => select(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c.id); } }} style={{ cursor: 'pointer' }}>
          <rect x={c.x} y={c.y} width={200} height={68} rx={6} fill={selected.id === c.id ? t.fill.secondary : t.bg.editor} stroke={selected.id === c.id ? accent : t.stroke.primary} />
          <text x={c.x + 13} y={c.y + 27} fill={t.text.primary} fontFamily="monospace" fontSize={12}>{c.name}</text>
          <text x={c.x + 13} y={c.y + 49} fill={t.text.secondary} fontSize={11}>{c.sub}</text>
        </g>)}
        <path d="M8 277H647" stroke={t.stroke.primary} />
        <text x={8} y={303} fontSize={11} fill={t.text.tertiary}>compile() 内部 · 任一步失败即返回 diagnostics</text>
        {['AST 导入策略', 'TypeScript 类型', 'esbuild 浏览器包'].map((label, i) => <g key={label}>
          <text x={8 + i * 222} y={341} fill={selected.id === 'compile' ? accent : t.text.secondary} fontSize={14}>{label}</text>
          {i < 2 && <path d={`M${146 + i * 222} 337H${209 + i * 222}`} stroke={t.stroke.primary} markerEnd="url(#call-normal)" />}
        </g>)}
        <rect x={4} y={390} width={924} height={38} rx={4} fill={t.fill.secondary} />
        <text x={18} y={414} fill={t.text.secondary} fontSize={12}>关键约束：保存源码尝试 ≠ 发布成功画面；编译失败不会覆盖最近可用构建。</text>
      </svg>
    </div>
    <div style={{ borderTop: `1px solid ${t.stroke.primary}`, paddingTop: 14 }} data-canvas-part="function-detail">
      <Row gap={16} wrap><Text weight="medium" style={{ fontFamily: 'monospace' }}>{selected.name}</Text><Text tone="secondary">{selected.detail}</Text></Row>
      <Text size="small" tone="tertiary" style={{ marginTop: 6 }}>来源：{selected.file} · 主路径节选，省略文件去重和冲突分支。</Text>
    </div>
  </Stack>;
}
