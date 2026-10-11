# README 展示图

这些图片是 Codex Canvas 1.0.0 的实际界面截图，采集日期为 2026-10-11。中英文 README 复用同一组图片，界面内容使用中文。

## 软件开发画廊

| 图片 | 可运行源码 | 截图内容 |
|---|---|---|
| `example-call-graph.jpg` | [函数调用](../../examples/call-graph.tsx) | 发布入口、写锁回调、编译与持久化函数 |
| `example-sequence.jpg` | [时序](../../examples/sequence.tsx) | 成功分支的参与者、生命线、调用和返回 |
| `example-class-diagram.jpg` | [类图](../../examples/class-diagram.tsx) | 三个真实类的成员、组合与引用 |
| `example-architecture.jpg` | [架构](../../examples/architecture.tsx) | 本地服务、可信工作台与隔离画布 |
| `example-dependencies.jpg` | [依赖](../../examples/dependencies.tsx) | 运行时依赖与可选的纯类型引用 |
| `example-state-machine.jpg` | [状态](../../examples/state-machine.tsx) | 更新失败后源码 r2、成功画面 r1 |

关系由仓库源码整理，简化范围标在各示例中；状态转换与版本号属于行为示意。这些视图不是自动分析工具。截图显示工作台与主图，较长的详情需要在运行的画布中滚动查看。

## 其他展示图

保留早期报告类示例的截图，便于文档继续引用：

- `canvas-report.jpg` / `example-report.jpg`：[报告](../../examples/report.tsx)。
- `design-mode.jpg`：报告文本的选区与局部修改要求；未发送 AI 消息。
- `example-comparison.jpg`：[选型](../../examples/comparison.tsx)。
- `example-roadmap.jpg`：[排期](../../examples/roadmap.tsx)。
- `example-charts.jpg`：[统计图](../../examples/charts.tsx)。
- `example-review.jpg`：[审查](../../examples/review.tsx)。

报告和统计使用虚构数据；其他旧图是教学案例，非项目承诺或真实评测。

图片均来自独立演示数据目录的本地浏览器模式，不是 Codex 原生侧栏截图。界面没有私人文档、私人路径或会话 URL，采集期间没有发送 AI 消息。更新时捕获真实运行结果，不通过修改截图隐藏不支持的能力。
