import { Stack, H1, H2, Text, Grid, Stat, LineChart, Table, Select, Row, Pill, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

// Illustrative data only. Replace with cited source data for a real report.
const rows = [
  { team: '产品', month: '五月', planned: 32, done: 29 }, { team: '产品', month: '六月', planned: 38, done: 35 },
  { team: '产品', month: '七月', planned: 42, done: 40 }, { team: '产品', month: '八月', planned: 45, done: 44 },
  { team: '工程', month: '五月', planned: 48, done: 40 }, { team: '工程', month: '六月', planned: 55, done: 49 },
  { team: '工程', month: '七月', planned: 60, done: 56 }, { team: '工程', month: '八月', planned: 66, done: 64 },
];
const months = ['五月', '六月', '七月', '八月'];
export default function Report() {
  const theme = useHostTheme();
  const [team, setTeam] = useCanvasState('team', '全部');
  const filtered = rows.filter(r => team === '全部' || r.team === team);
  const total = filtered.reduce((sum, r) => sum + r.done, 0);
  const planned = filtered.reduce((sum, r) => sum + r.planned, 0);
  const monthly = (field: 'done' | 'planned') => months.map(month => filtered.filter(r => r.month === month).reduce((sum, r) => sum + r[field], 0));
  return <Stack gap={24} style={{ padding:24, maxWidth:960, margin:'0 auto' }}>
    <Stack gap={8}>
      <Row gap={12} wrap><H1>团队交付节奏</H1><Pill size="sm">演示数据</Pill></Row>
      <Text tone="secondary">五月至八月，交付数量持续增长，完成量逐步接近计划。</Text>
    </Stack>
    <Row justify="space-between" wrap gap={12}>
      <Text tone="secondary" size="small">2026 年 5–8 月 · 单位：任务数（项）</Text>
      <Row gap={8}><Text size="small">团队</Text><Select value={team} onChange={setTeam} options={['全部', '产品', '工程'].map(value => ({ value, label:value === '全部' ? '全部团队' : value }))} /></Row>
    </Row>
    <Grid columns="repeat(auto-fit, minmax(min(100%, 160px), 1fr))" gap={20}>
      <Stat label="已完成任务" value={`${total} 项`} />
      <Stat label="计划完成率" value={`${Math.round(total / planned * 100)}%`} />
      <Stat label="尚未完成" value={`${planned - total} 项`} />
    </Grid>
    <Stack gap={12}>
      <H2>每月计划与完成量</H2>
      <LineChart categories={months} height={260} valueSuffix=" 项" series={[
        { name:'已完成', data:monthly('done'), tone:'info' },
        { name:'计划', data:monthly('planned'), tone:'neutral' },
      ]} />
      <Text tone="tertiary" size="small">来源：内置演示数据，非真实业务指标。完成率 = 已完成 ÷ 计划。</Text>
    </Stack>
    <Stack gap={12}>
      <Row justify="space-between"><H2>交付明细</H2><Text size="small" tone="tertiary">{filtered.length} 条记录</Text></Row>
      <Table framed striped headers={['团队', '月份', '计划 / 项', '完成 / 项', '完成率']} rows={filtered.map(r => [r.team, r.month, r.planned, r.done, `${Math.round(r.done / r.planned * 100)}%`])} columnAlign={['left', 'left', 'right', 'right', 'right']} />
    </Stack>
    <Text size="small" style={{ color:theme.text.tertiary }}>筛选同步更新统计、趋势和明细；选择会保存在这张画布中。</Text>
  </Stack>;
}
