# Canvas Examples

从软件开发中常用的六种图开始：函数调用关系、时序图、UML 类图、系统架构、模块依赖和状态转换。每份示例都是可交互的单文件 TSX，只从 `@codex-canvas/sdk` 导入。

## 打开示例

在 Codex 中让 Agent 使用插件的 `canvas_open_file` 打开示例，原生面板不可用时保留源码并说明原因，不自动打开浏览器。

仅当需要独立浏览器示例时，完成依赖安装与构建后在仓库根目录执行：

```sh
pnpm canvas open examples/architecture.tsx --browser
pnpm canvas open examples/call-graph.tsx --browser
pnpm canvas open examples/sequence.tsx --browser
pnpm canvas open examples/class-diagram.tsx --browser
pnpm canvas open examples/dependencies.tsx --browser
pnpm canvas open examples/state-machine.tsx --browser
```

每次命令都会返回本地预览链接。安装插件后，也可以让 Codex 使用 Canvas 打开文件，或使用工作台的「打开文件」。首页仍提供报告、架构、审查三个快捷模板，其余示例通过文件打开。

## 软件开发画廊

这些示例从同一套项目源码中选择不同视角。它们是经过整理的教学视图，不会自动分析或持续同步任意代码仓库。

| 示例 | 适合回答的问题 | 可操作的内容 |
|---|---|---|
| [call-graph.tsx](call-graph.tsx) | 一次请求最终调用了哪些函数？ | 点选函数查看职责、条件和源码文件 |
| [sequence.tsx](sequence.tsx) | 参与者在什么时候调用谁，返回什么？ | 切换成功 / 失败，观察构建写入与结果变化 |
| [class-diagram.tsx](class-diagram.tsx) | 哪个类持有哪些成员，谁引用谁？ | 选择类，查看成员分区、组合、引用和职责 |
| [architecture.tsx](architecture.tsx) | 代码在哪里执行，数据跨越哪些边界？ | 点选模块，查看 Node / 可信外壳 / sandbox 的边界 |
| [dependencies.tsx](dependencies.tsx) | 模块向谁依赖，哪些只是类型引用？ | 切换运行时 / 类型引用，选择模块理解分层 |
| [state-machine.tsx](state-machine.tsx) | 发布失败后留下什么，修复后如何变化？ | 切换三个情景，对比 sourceRevision 与 publishedRevision |

画面见 [README 画廊](../README.md#示例画廊)。选择通过 `useCanvasState` 保存在各自画布中，普通交互不发送 AI 消息。图表保持可读的最小宽度；较窄的侧栏中可以横向滚动。

## 可以直接使用的提示词

为任意画布要求加上：

> 必须使用 Codex Canvas 插件的原生 MCP App 工具打开并展示画布，不打开浏览器或 localhost 链接，不使用 CLI open / --serve 回退。原生工具或连接不可用时保留源码，说明具体原因并停止打开步骤。

**函数调用关系**

> 阅读当前仓库，从这个请求入口追踪关键函数调用。用从左到右的调用图表示调用者 → 被调用者，标明条件和异常分支。点击函数显示职责与源文件位置。只画源码中能确认的关系，列出省略的路径。

**时序图**

> 用 Canvas 解释这个接口的请求时序。画出参与者、生命线、实线调用与虚线返回，支持切换成功、超时和重试路径。用实际方法名与返回结果，不编造耗时。

**UML 类图**

> 读取这个模块，画 UML 类图。按类名、属性、方法分区，明确可见性。区分继承、组合和普通引用；点击类显示职责与源码位置。对缩写和省略的成员作说明。

**系统架构**

> 按 Cursor Canvas 的紧凑、扁平风格画当前系统架构。以执行环境和信任边界组织模块，突出主数据流，标注存储与外部接口。中性色为主，只用一个强调色表示选择；不要把所有模块排成等权卡片。点选模块显示职责与代码位置。

**模块依赖**

> 根据真实 import / export 画项目的关键模块依赖，箭头从使用方指向提供方。区分运行时与纯类型引用，标明第三方适配层。支持点选模块查看依赖依据，不把构建时引用误画成运行权限。

**状态转换**

> 根据实现画出这个对象的状态转换。边上标明事件与条件，包含失败、重试和恢复。用可切换情景展示相关字段如何变化。如果状态是推导的概念而非源码 enum，请明确说明。

## 设计与源码依据

- 调用图和时序图依据 [CanvasService](../packages/mcp-server/src/service.ts)、[CanvasStore](../packages/runtime/src/store.ts) 和 [编译器](../packages/runtime/src/compiler.ts)。发布主路径省略去重、锁文件 I/O 和部分初始化步骤。
- 类图使用真实的 `CanvasService`、`CanvasFiles`、`CanvasStore`，方法签名为节选。`CanvasService` 创建 `CanvasFiles`，两者引用同一 Store；没有继承关系。
- 架构图表达逻辑数据流，构建通过存储与服务读取交付，不表示编译器直接访问宿主。依赖图展示关键静态依赖，不是完整 npm 依赖树。
- 状态图根据发布结果推导，不是实现中的状态枚举。r1 → r2 → r3 是示意；首次失败没有可保留的成功画面。删除 / 恢复属于独立维度。
- 视觉沿用 Cursor Canvas 的主图突出、辅助紧凑、主题中性色原则；本项目使用自己的 SDK、宿主桥和文件入口。提示词规范见 [Canvas Skill](../skills/canvas/SKILL.md)。

## 其他可复用示例

| 文件 | 场景 | 数据边界 |
|---|---|---|
| [report.tsx](report.tsx) | 团队筛选、统计、折线图、明细表 | 内置虚构数据 |
| [comparison.tsx](comparison.tsx) | 按场景对比选型依据 | 简化教学模型，非供应商评测 |
| [roadmap.tsx](roadmap.tsx) | 时间条、状态筛选与阶段详情 | 虚构八周计划，非项目承诺 |
| [charts.tsx](charts.tsx) | 分组柱状图、环形图与时间范围 | 内置虚构数据 |
| [review.tsx](review.tsx) | 发现列表、严重程度与修改建议 | 教学案例，非本项目当前缺陷清单 |

`pnpm demo` 是另一条入口：从当前仓库采集真实源码统计并生成报告，采集时间与来源会写入内容。所有示例采用项目的 [MIT 许可证](../LICENSE)，导入和组件限制见 [SDK 契约](../docs/SDK.md)。
