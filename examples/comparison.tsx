import { Stack, Row, Grid, H1, H2, Text, Pill, Card, CardHeader, CardBody, Table, Callout, useCanvasState } from '@codex-canvas/sdk';

// Illustrative decision model, not a vendor benchmark or measured score.
const contexts = {
  personal: { label: '个人工具', title: '单人、本机使用：先选本地文件', reason: '部署步骤少，数据结构容易检查。把导入导出与备份做好，再根据协作需求演进。' },
  team: { label: '协作应用', title: '多人协作：优先评估托管数据库', reason: '先明确权限、并发写入与恢复要求，再评估服务配置和成本。两种方案都需要备份策略。' },
};

export default function Comparison() {
  const [context, setContext] = useCanvasState('comparisonContext', 'personal');
  const choice = contexts[context as keyof typeof contexts] ?? contexts.personal;
  return <Stack gap={20} style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
    <Row gap={12} wrap><H1>存储方案，如何选？</H1><Pill size="sm">决策示例</Pill></Row>
    <Row justify="space-between" gap={12} wrap>
      <Text tone="secondary">先看使用场景，再比较运维与协作取舍。</Text>
      <Row gap={8}>{Object.entries(contexts).map(([key, value]) => <Pill key={key} active={context === key} onClick={() => setContext(key)}>{value.label}</Pill>)}</Row>
    </Row>
    <div data-canvas-part="recommendation"><Callout title={choice.title} tone="info">{choice.reason}</Callout></div>
    <Grid columns="repeat(auto-fit, minmax(min(100%, 260px), 1fr))" gap={16}>
      <Card><CardHeader trailing={<Pill size="sm">方案 A</Pill>}>本地文件</CardHeader><CardBody><Text weight="medium">单机优先 · 数据随本机保存</Text><Text tone="secondary">适合个人工具、原型和单进程应用。并发、迁移与备份由应用设计。</Text></CardBody></Card>
      <Card><CardHeader trailing={<Pill size="sm">方案 B</Pill>}>托管数据库</CardHeader><CardBody><Text weight="medium">服务化 · 面向共享数据</Text><Text tone="secondary">适合需要共享访问的应用。权限、连接、配额与服务配置需要管理。</Text></CardBody></Card>
    </Grid>
    <Stack gap={12}>
      <H2>关键取舍</H2>
      <Table framed striped headers={['考虑因素', '本地文件', '托管数据库']} rows={[
        ['起步方式', '应用读写文件', '配置实例与连接'],
        ['离线工作', '可设计为完全离线', '通常依赖服务连接'],
        ['协作与并发', '自行设计协调机制', '利用数据库能力并配置权限'],
        ['备份与恢复', '复制、校验与恢复流程', '评估服务备份策略并演练恢复'],
        ['适合的起点', '单人、本地、结构简单', '共享、多用户、查询需求明确'],
      ]} />
    </Stack>
    <Text size="small" tone="tertiary">示意模型：比较两种部署方式，不代表具体产品承诺。切换场景会更新建议，不会发送 AI 请求。</Text>
  </Stack>;
}
