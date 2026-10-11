---
title: 在 Codex 中复现 Cursor Canvas
subtitle: SDK、开源底座、宿主接入与开发路线
template: doc
theme: blueprint
lang: zh
调研日期: 2026-10-10
目标宿主: Codex 桌面版
证据: 官方文档、已安装 SDK、开源源码
---

## A 结论与证据边界

```callout ok 推荐路线
以 cursor-canvas-web 为渲染底座，开发自己的 Canvas 插件。
插件组合 Skill、MCP 服务、React 运行时与宿主桥接。
先确认 Codex 的会话侧栏能力，再接入画布。
```

Cursor Canvas 的核心是可保存的 React 交互产物。
它把 AI 生成的视图放在聊天旁边，支持继续修改。
工作区列表和聊天引用让用户能再次打开它。
[来源：Cursor 官方文档](https://cursor.com/docs/agent/tools/canvas)

这次找到的 cursor-canvas-web 比通用白板更接近目标。
它重写了 cursor/canvas 组件接口，能运行原有 TSX 文件。
宿主操作和持久化仍需适配。
[来源：兼容层 README](https://github.com/thisismydesign/cursor-canvas-web)

| 证据层级 | 已确认内容 | 使用方式 |
|---|---|---|
| 官方文档 | 聊天旁展示、保存、分享、元素批注 | 复现产品交互 |
| 本机 SDK 声明 | 单文件 TSX、组件接口、状态与宿主动作 | 设计自己的接口 |
| 开源源码 | Mantine 兼容层、SSE 更新、反馈存储 | 选择可复用代码 |
| 本报告的设计建议 | esbuild 编译、版本存储、隔离与桥接 | 作为开发方案 |

Cursor 的编译器选型和完整沙箱实现尚未确认。
本报告没有执行 Cursor 运行时或开源项目的测试。
阅读源码能确认结构，不能证明所有功能都能运行。

## B Cursor 如何把回答变成画布

```flow LR
用户任务 -> Agent: 判断是否需要交互视图
Agent -> TSX文件: 收集数据并生成源码
TSX文件 -> 类型检查: 校验 SDK 用法
类型检查 -> Agent: 返回诊断并修复
类型检查 -> 画布视图: 宿主编译并展示
画布视图 -> 本地交互: 筛选、折叠、选择
画布视图 -> Agent: 批注或按钮提示词
Agent -> TSX文件: 修改并再次展示
```

**生成协议。** 本机 Skill 要求单个 .canvas.tsx 文件。
文件默认导出 React 组件，只从 cursor/canvas 导入。
数据写入文件，禁止直接 fetch 或安装任意 npm 包。
源码保存在用户目录下的工作区 canvases 文件夹。
本机生成契约（`~/.cursor/skills-cursor/canvas/SKILL.md`）

**检查与修复。** 修改文件后，Agent 会收到类型诊断。
这让错误进入下一轮修复，而不只留在浏览器控制台。
具体编译器并未在这些声明中公开。

**指向元素修改。** Design Mode 允许选择并批注 UI 元素。
按钮还能触发指定提示词，进入后续 Agent 工作。
[来源：Cursor 3.7 更新](https://cursor.com/changelog/canvas-improvements)

**保存与分享。** 本地画布可以重开并更新数据。
官方还提供面向团队的只读快照分享。
分享的账号条件见官方文档，开发首版可先做本地保存。
[来源：分享说明](https://cursor.com/docs/agent/tools/canvas#sharing-canvases)

## C 为什么它看起来统一、交互却灵活

| SDK 层 | 本机接口 | 对复现效果的作用 |
|---|---|---|
| 布局与文字 | Grid、Row、Stack、H1、Text、Code | 统一间距和阅读层级 |
| 数据展示 | Stat、Table、Pill、Callout | 稳定表达数值和状态 |
| 图表与关系 | BarChart、LineChart、PieChart、DAG | 用有限接口表达分析结果 |
| 代码与任务 | DiffView、DiffStats、TodoList | 复用编程工具的视觉语义 |
| 表单与动作 | Button、Select、Checkbox、TextInput | 支持用户操作和后续请求 |
| 状态与主题 | useCanvasState、useHostTheme | 保存交互，并匹配宿主主题 |

组件出口声明（`~/.cursor/skills-cursor/canvas/sdk/index.d.ts`）

useCanvasState 按稳定字符串键保存数据。
数据位于源码旁的 .canvas.data.json 文件。
声明明确支持重编译、刷新和 IDE 重启后的恢复。
普通 React useState 仍适合临时 UI 状态。
状态声明（`~/.cursor/skills-cursor/canvas/sdk/hooks.d.ts:87`）

useCanvasAction 暴露宿主动作，采用发送后不等待响应的方式。
当前声明包括打开 Agent 会话、新聊天和工作区文件。
新聊天可携带画布引用和提示词。
动作声明（`~/.cursor/skills-cursor/canvas/sdk/hooks.d.ts:123`）

主题使用语义颜色、字体、圆角与间距。
Skill 同时约束 Agent 的配色和布局选择。
图表声明说明其渲染使用内联 SVG。
DAG 接口输出布局坐标，由视图负责绘制。
图表声明（`~/.cursor/skills-cursor/canvas/sdk/chart-primitives.d.ts:1`）
DAG 声明（`~/.cursor/skills-cursor/canvas/sdk/dag-layout.d.ts`）

**设计建议：组件约束和生成规则一起实现。**
只给模型一个自由 HTML 容器，很难持续得到一致的效果。
首版应提供少量稳定组件和真实数据模板。
让模型读取类型声明，单位、日期和空值规则写入 Skill。

## D 当前开源替代分别解决什么

| 项目 | 形态与许可 | 已有能力 | 适合你的用途 |
|---|---|---|---|
| [cursor-canvas-web](https://github.com/thisismydesign/cursor-canvas-web) | React SDK 兼容层；MIT | 表格、图表、表单、Diff、主题 | 优先作为渲染底座 |
| [Glimpse](https://github.com/YushengAuggie/glimpse) | 本地 HTML 展示工具；MIT | SSE 更新、选中文字反馈、持久评论 | 借鉴发布与反馈流程 |
| [OpenCanvas](https://github.com/ashark-ai-05/opencanvas) | 独立空间工作台；应用 MIT | typed widgets、place_widget、REST/SSE | 借鉴工具协议与组件校验 |
| [Whiteboard](https://github.com/kamiazya/whiteboard) | MCP 协作图板；当前核心 Apache-2.0 | Codex 插件、图形共编、JSON Canvas | 用于架构和流程图模式 |

Glimpse 的服务器推送产物更新，反馈按文档存储。
源码包含带锚点的评论和原子写入。
它主要通过 Chrome/CDP 接入，尚需适配 Codex 原生侧栏。
[更新服务源码](https://github.com/YushengAuggie/glimpse/blob/44717863a5d4adbd007a3d5bbbd0250be26b1200/lib/glimpse-server.mjs)
[评论存储源码](https://github.com/YushengAuggie/glimpse/blob/44717863a5d4adbd007a3d5bbbd0250be26b1200/lib/glimpse-threads.mjs)

OpenCanvas 校验组件 payload，错误会返回给 Agent 修复。
按会话分发的 SSE 总线把外部请求传给画布。
它是独立应用，迁移到 Codex 需要重接宿主。
[组件工具源码](https://github.com/ashark-ai-05/opencanvas/blob/8e50f7fc3d0de047c531ac9be5e37255aa9615ec/src/agent/tools/place-widget.ts)
[事件总线源码](https://github.com/ashark-ai-05/opencanvas/blob/8e50f7fc3d0de047c531ac9be5e37255aa9615ec/src/backend/canvas-event-bus.ts)

**依赖许可要按实际版本确认。** OpenCanvas 使用 tldraw ^3.0.0。
该版本有水印等条件，其许可不是 MIT。

当前 tldraw SDK 的生产部署另需有效许可密钥。
应用仓库的 MIT 许可不覆盖这些依赖条件。
[tldraw 3.0 许可](https://github.com/tldraw/tldraw/blob/v3.0.0/LICENSE.md)
[当前 SDK 许可说明](https://tldraw.dev/community/license)

Whiteboard 面向多人和 Agent 共编图形。
它提供 Codex 插件，但展示形态与 React 报告不同。
[安装与架构说明](https://github.com/kamiazya/whiteboard#codex)

另外，Xiangyu-CAS/codex-canvas 主要处理图片画布。
其 README 提醒：app-server 发送可能不显示在当前桌面聊天中。
这个限制值得避免。
[项目说明](https://github.com/Xiangyu-CAS/codex-canvas#storage-and-state)

## E 最接近的兼容层，还缺哪些部分

cursor-canvas-web 的 npm 当前版本为 0.3.0。
本次同时读取了源码和 npm 元数据。
Vite alias 将 cursor/canvas 映射到 Mantine 实现。
运行时提供 CanvasRoot 和 mountCanvas。
[包声明](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/package.json)
[运行时源码](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/src/runtime/index.tsx)

| 源码发现 | 影响 | 插件要补的功能 |
|---|---|---|
| useCanvasAction 只记开发日志 | 点击后不能打开宿主会话 | 接入消息、文件与导航接口 |
| 状态键是 canvas:加作者键名 | 同源多画布可能使用相同键 | 加工作区与画布作用域 |
| 状态写入 localStorage | 浏览器存储承担恢复能力 | 改为宿主文件或数据库 |
| 主题来自 Mantine 色彩模式 | 未直接读取 Codex 样式 | 接入宿主主题变量 |
| Diff 是简化实现 | 与原生显示有差异 | 补语法高亮和长 Diff 性能 |
| 无生成、诊断和元素批注流程 | 只是组件运行环境 | 添加编译服务与反馈桥接 |

[Hooks 与动作源码](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/src/shim/cursor-canvas.tsx#L100)
[主题适配源码](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/src/shim/use-tokens.ts)

README 声称覆盖公共 API，但兼容需要逐项核对。
例如，本机 SDK 新增 openFile，兼容层的动作类型未包含它。
它适合起步，不能据此承诺完全兼容或像素一致。

建议给产品暴露自己的模块名，例如 @your/canvas。
可保留 cursor/canvas alias，作为现有文件的迁移入口。
固定 SDK 版本，维护组件兼容表，并保留 MIT 声明。
本机 Cursor 声明可用于研究接口，不直接打包分发。

## F 在 Codex 桌面版如何接入

OpenAI 已公开 MCP Apps 和插件扩展。
扩展包括会话侧栏、文件查看器、上下文与消息回传。
工具通过 UI resourceUri 绑定界面。
thread 入口为每个会话创建独立界面实例。
[官方扩展文档](https://developers.openai.com/plugins/build/extensions)
[入口规范](https://github.com/openai/mcp-extensions/blob/0d606217705e0e71eb21fff009619b67b80611dc/docs/spec.md#thread-entrypoint)

```ts title="会话入口元数据 · 设计示意"
_meta: {
  ui: { resourceUri: "ui://your-canvas/viewer" },
  "openai/ui": { entrypoints: [{ type: "thread" }] }
}
```

```callout warn 当前客户端仍需能力探测
文档主要使用 ChatGPT Desktop / Work 的名称。
示例插件也声明面向 Codex，但这不能证明本机支持。
本次未安装探针插件，未完成当前桌面宿主的运行验证。
```

官方兼容指南给出最低桌面版本 26.928.20710。
这是这些扩展的版本门槛，不是本机版本的检查结果。
初始化后还要逐项读取宿主能力。
SDK 中不支持的扩展可能保持 undefined。
[官方兼容指南](https://github.com/openai/mcp-extensions/blob/0d606217705e0e71eb21fff009619b67b80611dc/docs/patterns.md#versioning)
[TypeScript SDK](https://github.com/openai/mcp-extensions/blob/0d606217705e0e71eb21fff009619b67b80611dc/typescript/README.md#mcp-app-setup)

| 宿主能力 | 首选实现 | 能力缺失时 |
|---|---|---|
| 会话侧栏入口 | 原生 MCP App 标签页 | 在内置浏览器展示本地页面 |
| ui/message 扩展 | 按钮发到当前会话或新会话 | 复制画布引用与提示词 |
| 模型上下文更新 | 回传当前筛选和选中元素 | 工具按画布 ID 读取状态 |
| 文件入口与资源订阅 | 点击文件重开并订阅更新 | 工具打开画布，服务推送更新 |
| 宿主主题 | 应用 hostContext 样式变量 | 使用系统深浅色和固定语义主题 |

原生桥接支持消息发送，也支持只写入草稿。
编辑请求可携带画布 ID、版本和选中元素。
用户点击明确的“让 AI 修改”按钮时再发送。
筛选、缩放和折叠只更新本地状态。
[消息扩展规范](https://github.com/openai/mcp-extensions/blob/0d606217705e0e71eb21fff009619b67b80611dc/docs/spec.md#uimessage-extensions)

建议参考官方 Bits & Bolts 的完整插件组织方式。
包由清单、MCP 配置、Skill 和编译后的 UI 组成。
新可移植格式使用根目录 plugin.json 与 mcp.json。
现有 .codex-plugin 清单仍有兼容支持。
[官方示例](https://github.com/openai/mcp-extensions/tree/0d606217705e0e71eb21fff009619b67b80611dc/plugins/bits-and-bolts)
[打包文档](https://developers.openai.com/plugins/build/plugins)

## G 推荐插件架构与协议

下图是开发建议，尚未实现。

```flow LR
Skill -> Agent: 触发与生成契约
Agent -> MCP服务: 发布源码或修改
MCP服务 -> 编译器: 限定导入并检查类型
编译器 -> Agent: 返回结构化诊断
编译器 -> 版本存储: 提交成功构建
版本存储 -> UI外壳: 通知画布更新
UI外壳 -> React沙箱: 加载成功版本
React沙箱 -> UI外壳: 发送状态和明确动作
UI外壳 -> 宿主桥接: 批注与修改请求
宿主桥接 -> Agent: 携带画布上下文
```

**工具协议建议。** 工具名属于本插件，不是官方 API。

| 工具 | 参数重点 | 返回结果 |
|---|---|---|
| canvas.publish | source、scope、sdkVersion | id、revision、诊断、UI 引用 |
| canvas.read | id、revision | 源码、状态、来源摘要 |
| canvas.patch | id、baseRevision、变更 | 新 revision 或版本冲突 |
| canvas.list | scope | 已保存画布列表 |
| canvas.feedback | id、revision、elementId、文本 | 反馈记录 |
| canvas.setState | id、key、JSON 值 | 持久化状态版本 |

**数据分开保存。** 源码、用户状态、反馈和构建各有文件。
manifest 记录画布 ID、作用域、SDK 与源码版本。
构建按源码 hash 存储，保留最近成功版本。
新的编译失败时继续显示旧版本，并展示错误。

**更新顺序。** 写入临时文件，检查通过后原子替换。
文件监听做防抖，再推送已提交版本。
用 baseRevision 拒绝过期修改，防止覆盖用户手改。
把错误文件、行号、信息和源码版本返回给 Agent。

**元素批注。** 编译时为 JSX 注入稳定 elementId。
UI 外壳管理选择框和批注，不依赖模型自行生成它们。
请求包括源码位置、版本、组件属性摘要和用户意见。
截图只作补充，源码映射用于定位修改。

**隔离与作用域。** 生成代码只在隔离的浏览器环境运行。
编译器采用允许列表，不执行 npm 生命周期或生成代码。
外壳与生成视图分开，网络受 CSP 和宿主规则约束。
外壳验证桥接消息、资源权限和文件路径。
源码限制不能替代浏览器隔离。

每个画布使用独立状态作用域和界面会话令牌。
不要假设 MCP 一定提供桌面聊天 ID。
有可信宿主元数据时绑定它；否则用明确的画布 ID。
不让模型猜测线程 ID，也不读取整份聊天数据库。

**技术选型建议。** React 加 Mantine 用于首版组件。
esbuild 用于受限 TSX 打包，TypeScript 负责类型诊断。
SDK 常驻，重新构建的画布模块独立加载。
宿主桥接采用 MCP Apps 与 OpenAI 扩展适配器。
SSE 或资源订阅只推送更新信号，再按版本读取内容。

## H 开发顺序与完成标准

| 阶段 | 交付物 | 完成标准 |
|---|---|---|
| 0 宿主探针 | 最小 UI 入口与一个交互按钮 | 能确认侧栏、主题、消息和资源能力 |
| 1 画布生成与恢复 | Skill、TSX 编译、侧栏展示、诊断 | AI 生成真实报告，出错能修复，刷新能恢复 |
| 2 持续交互 | 状态保存、按钮回传、元素批注 | 用户指定元素，AI 修改后视图更新 |
| 3 产品完善 | 画布列表、历史版本、导出与分享 | 可重开、可撤回、可迁移数据 |

首版只需一组稳定的统计、表格、图表和表单组件。
用同一套语义主题生成报告、架构图和代码审查视图。
记录数据来源与时间，避免生成空白占位内容。

建议之后验证这些场景：

- 表格筛选与图表联动，操作后不自动发起 Agent 请求。
- 两个画布使用相同状态键，数据仍互相隔离。
- 编译失败后保留可用视图，并返回准确诊断。
- 重启后恢复画布、筛选和评论。
- 元素批注带版本定位，修改完成后仍能追踪。
- 两个会话同时打开画布，消息进入正确宿主会话。
- 原生扩展不可用时，预览与复制反馈仍然可用。

这些是后续验收建议，本次没有执行这些验证。

**本次保存的源码快照。** 下表日期是提交日期。

| 仓库 | 提交 | 日期 |
|---|---|---|
| cursor-canvas-web | 8d1a172aba11 | 2026-06-20 |
| OpenAI MCP Extensions | 0d606217705e | 2026-10-09 |
| cursor/plugins | d73344bee8cf | 2026-10-09 |
| Glimpse | 44717863a5d4 | 2026-10-08 |
| OpenCanvas | 8e50f7fc3d0d | 2026-10-10 |
| Codex-Canvas | b8018398c3cb | 2026-10-01 |

源码位于 [本次调研目录](../../canvas-research-20261010)。
官方 Markdown 文档也已保存，便于核对日期和接口。
这些是只读研究副本，尚未作为插件安装。

最终建议：先完成宿主探针，再复用兼容层开发 React 画布。
接下来优先投入状态、诊断和双向编辑。
这三部分直接决定它能否成为持续使用的聊天产物。
