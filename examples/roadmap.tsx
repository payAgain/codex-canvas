import { Stack, Row, Grid, H1, H2, Text, Pill, Stat, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

// Illustrative schedule. It is not the Codex Canvas project's delivery plan.
const tasks = [
  { id: 'research', title: '需求与交互', start: 0, span: 2, state: '已完成', owner: '产品', detail: '明确用户路径，完成低保真交互和范围评审。', outcome: '需求清单 · 交互原型' },
  { id: 'foundation', title: '基础能力', start: 1, span: 3, state: '已完成', owner: '工程', detail: '搭建数据模型、核心接口与组件约定。', outcome: '接口契约 · 基础组件' },
  { id: 'experience', title: '核心体验', start: 3, span: 3, state: '进行中', owner: '工程', detail: '完成关键页面与交互，边实现边记录体验问题。', outcome: '可操作的内测版本' },
  { id: 'validation', title: '验证与反馈', start: 5, span: 2, state: '待开始', owner: '质量', detail: '执行使用场景验收，跟进反馈并整理已知边界。', outcome: '验收记录 · 问题清单' },
  { id: 'release', title: '文档与发布', start: 6, span: 2, state: '待开始', owner: '维护者', detail: '整理文档、示例与发行包，准备首次发布。', outcome: '使用指南 · 发布说明' },
];

export default function Roadmap() {
  const theme = useHostTheme();
  const [filter, setFilter] = useCanvasState('roadmapFilter', '全部');
  const [selected, setSelected] = useCanvasState('roadmapTask', 'experience');
  const visible = filter === '全部' ? tasks : tasks.filter(task => task.state === filter);
  const chosen = visible.find(task => task.id === selected) ?? visible[0];
  return <Stack gap={24} style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
    <Row gap={12}><H1>从想法到交付</H1><Pill size="sm">示例排期 · 8 周</Pill></Row>
    <Text tone="secondary">把阶段、时间与交付物放在一张图里。点击时间条查看工作范围。</Text>
    <Grid columns={3} gap={16}><Stat label="工作阶段" value={tasks.length} /><Stat label="已完成" value={tasks.filter(task => task.state === '已完成').length} /><Stat label="进行中" value={tasks.filter(task => task.state === '进行中').length} /></Grid>
    <Row gap={8} wrap>{['全部', '已完成', '进行中', '待开始'].map(state => <Pill key={state} active={filter === state} onClick={() => setFilter(state)}>{state}</Pill>)}</Row>
    <div style={{ overflowX: 'auto' }} data-canvas-part="timeline">
      <div style={{ minWidth: 580 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px repeat(8, 1fr)', marginBottom: 10, color: theme.text.tertiary, fontSize: 12 }}><span>工作阶段</span>{Array.from({ length: 8 }, (_, week) => <span key={week} style={{ textAlign: 'center' }}>W{week + 1}</span>)}</div>
        {visible.map(task => <div key={task.id} style={{ display: 'grid', gridTemplateColumns: '140px repeat(8, 1fr)', alignItems: 'center', minHeight: 45, borderTop: `1px solid ${theme.stroke.tertiary}` }}>
          <Text size="small" weight="medium">{task.title}</Text>
          <button onClick={() => setSelected(task.id)} aria-pressed={chosen?.id === task.id} style={{ gridColumn: `${task.start + 2} / span ${task.span}`, padding: '7px 10px', margin: '5px 3px', borderRadius: 5, cursor: 'pointer', fontSize: 12, textAlign: 'left', border: `1px solid ${chosen?.id === task.id ? theme.accent.primary : theme.stroke.primary}`, color: chosen?.id === task.id ? theme.text.onAccent : theme.text.secondary, background: chosen?.id === task.id ? theme.accent.primary : theme.fill.secondary }}>{task.state} · {task.owner}</button>
        </div>)}
      </div>
    </div>
    {chosen && <Stack gap={8}><H2>{chosen.title}</H2><Text tone="secondary">{chosen.detail}</Text><Text size="small">交付物：{chosen.outcome}</Text></Stack>}
    <Text tone="tertiary" size="small">虚构项目排期，用于演示时间线、筛选和阶段选择；不代表本插件的发布日期。时间条不提供拖拽编辑。</Text>
  </Stack>;
}
