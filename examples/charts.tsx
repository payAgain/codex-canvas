import { Stack, Row, Grid, H1, H2, Text, Pill, Stat, BarChart, PieChart, useCanvasState } from '@codex-canvas/sdk';

// Synthetic daily counts. Totals and conversion percentages are derived below.
const days = [
  { day: '周一', direct: 90, repo: 42, shared: 27, actions: 55 },
  { day: '周二', direct: 108, repo: 48, shared: 30, actions: 66 },
  { day: '周三', direct: 124, repo: 60, shared: 36, actions: 84 },
  { day: '周四', direct: 112, repo: 56, shared: 34, actions: 77 },
  { day: '周五', direct: 146, repo: 72, shared: 45, actions: 103 },
  { day: '周六', direct: 98, repo: 52, shared: 40, actions: 76 },
  { day: '周日', direct: 116, repo: 63, shared: 46, actions: 94 },
];

export default function Charts() {
  const [range, setRange] = useCanvasState('chartRange', 'week');
  const visible = range === 'recent' ? days.slice(-5) : days;
  const sum = (field: 'direct' | 'repo' | 'shared' | 'actions') => visible.reduce((total, day) => total + day[field], 0);
  const views = sum('direct') + sum('repo') + sum('shared');
  const channels = [{ label: '直接访问', value: sum('direct'), tone: 'info' as const }, { label: '仓库入口', value: sum('repo'), tone: 'neutral' as const }, { label: '分享链接', value: sum('shared'), tone: 'warning' as const }];
  return <Stack gap={24} style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
    <Row justify="space-between" gap={12} wrap><Row gap={12}><H1>产品使用概览</H1><Pill size="sm">演示数据</Pill></Row><Row gap={8}>
      <Pill active={range === 'week'} onClick={() => setRange('week')}>全部 7 天</Pill><Pill active={range === 'recent'} onClick={() => setRange('recent')}>最近 5 天</Pill>
    </Row></Row>
    <Text tone="secondary">一次筛选，同时观察访问趋势、有效操作和来源构成。</Text>
    <Grid columns="repeat(auto-fit, minmax(min(100%, 180px), 1fr))" gap={16}>
      <Stat label="访问次数" value={views.toLocaleString()} /><Stat label="有效操作 / 次" value={sum('actions')} /><Stat label="操作 / 访问" value={`${Math.round(sum('actions') / views * 100)}%`} />
    </Grid>
    <Grid columns="repeat(auto-fit, minmax(min(100%, 300px), 1fr))" gap={28}>
      <Stack gap={12}><H2>访问与操作</H2><Text tone="tertiary" size="small">每日计数 · 单位：次</Text>
        <BarChart height={250} categories={visible.map(day => day.day)} valueSuffix=" 次" series={[
          { name: '访问', data: visible.map(day => day.direct + day.repo + day.shared), tone: 'info' },
          { name: '有效操作', data: visible.map(day => day.actions), tone: 'neutral' },
        ]} />
      </Stack>
      <Stack gap={12}><H2>访问来自哪里</H2><Text tone="tertiary" size="small">来源计数 · 与左侧访问总量一致</Text>
        <PieChart donut size={210} data={channels} />
        <Grid columns={3} gap={8}>{channels.map(channel => <Stack key={channel.label} gap={4}><Text size="small" tone="secondary">{channel.label}</Text><Text size="small" weight="medium">{channel.value} 次 · {Math.round(channel.value / views * 100)}%</Text></Stack>)}</Grid>
      </Stack>
    </Grid>
    <Text tone="tertiary" size="small">来源：内置虚构样本。每次有效操作记为一个事件，不代表独立用户或真实产品表现。比例由当前筛选数据计算。</Text>
  </Stack>;
}
