<div align="center">

# Codex Canvas

### 把回答变成可以探索的画布。

在 Codex 中读懂函数调用、时序、类关系与系统架构。选中一部分，继续用自然语言修改。

**中文** · [English](README.en.md)

[![Version](https://img.shields.io/badge/version-1.1.0-blue)](CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-43853d)](package.json)

[示例画廊](#示例画廊) · [快速开始](#快速开始) · [安装到 Codex](#安装到-codex) · [工作原理](#工作原理) · [参与贡献](#参与贡献)

</div>

![Codex Canvas 系统架构：本地服务、可信工作台与隔离视图](docs/assets/example-architecture.jpg)

<p align="center"><em>实际运行截图 · 基于项目源码的架构视图 · 本地浏览器模式</em></p>

Codex Canvas 是面向 **Codex 桌面端**的开源插件。通过 MCP Apps，画布可以显示在支持的宿主侧边面板中；也可以在本地浏览器独立运行。源码、版本和交互状态保存在本地，一张画布可以反复打开、探索和编辑。

## 示例画廊

**软件开发中常用的六种图，都可以直接运行和交互。** 示例以 Codex Canvas 自身源码为素材，从函数调用到运行边界，展示同一系统的不同视角。点击图片放大，打开对应 TSX 即可体验。

| 函数调用关系 | 时序图 |
|:---|:---|
| [![函数调用图：从 CanvasService.call 到编译和持久化](docs/assets/example-call-graph.jpg)](docs/assets/example-call-graph.jpg) | [![时序图：参与者、生命线、调用与返回](docs/assets/example-sequence.jpg)](docs/assets/example-sequence.jpg) |
| 从发布入口追踪被调用函数，点选节点查看条件与源码位置。<br>[查看源码 →](examples/call-graph.tsx) | 切换编译成功 / 失败，观察构建写入与返回结果的差别。<br>[查看源码 →](examples/sequence.tsx) |
| **UML 类图** | **系统架构** |
| [![UML 类图：属性、方法、组合和单向引用](docs/assets/example-class-diagram.jpg)](docs/assets/example-class-diagram.jpg) | [![系统架构：Node、可信外壳和 sandbox 三个运行边界](docs/assets/example-architecture.jpg)](docs/assets/example-architecture.jpg) |
| 查看真实类的成员分区、组合与引用，点击类查看职责。<br>[查看源码 →](examples/class-diagram.tsx) | 按运行边界组织模块，理解代码、状态与选区如何流转。<br>[查看源码 →](examples/architecture.tsx) |
| **模块依赖图** | **状态转换图** |
| [![依赖图：使用方指向提供方，区分运行时与类型依赖](docs/assets/example-dependencies.jpg)](docs/assets/example-dependencies.jpg) | [![状态转换图：发布、失败、重试与双版本变化](docs/assets/example-state-machine.jpg)](docs/assets/example-state-machine.jpg) |
| 沿依赖方向理解分层，切换查看编译后擦除的类型引用。<br>[查看源码 →](examples/dependencies.tsx) | 切换首次成功、更新失败和修复成功，查看源码与发布版本。<br>[查看源码 →](examples/state-machine.tsx) |

截图来自实际运行的 Canvas，界面使用中文。图中的关系依据源码整理并做了明确简化；状态图是行为模型，版本号为示意。这些文件是可修改的示例，不是自动生成并持续同步的代码索引。打开方法、可直接使用的提示词，以及报告 / 统计 / 审查等补充示例见 [示例说明](examples/README.md)。

## 从查看，到一起修改

- **在聊天旁探索内容** — 支持原生侧边面板与本地浏览器预览，可选亮白、暖纸、青雾、石墨黑、午夜蓝，或跟随宿主。
- **只修改你选中的部分** — Design mode 支持点选元素、选择父层，再附上修改要求。
- **打开已有 TSX / JSX** — 使用 SDK 格式的单文件画布；开启文件跟随后，保存源码即可更新预览。
- **保存进度与交互** — 筛选状态按画布保存；源码保留版本，编译失败时保留最近成功画面。
- **管理自己的画布库** —「打开文件」默认浏览画布目录，显示源码位置与已删除项；删除后可恢复并打开。

### Design mode：指出哪里，再说明怎么改

![Design mode：选中报告中的文字，并填写局部修改要求](docs/assets/design-mode.jpg)

打开 **Design mode → 点击内容 → 输入要求**。宿主支持时，可以添加选区上下文到聊天或发送修改请求；浏览器模式可以复制选区后粘贴到聊天。普通筛选和点选不会启动 AI。

*截图来自浏览器模式：原生聊天按钮因缺少宿主消息能力而禁用，修改要求未发送。*

## 快速开始

需要 **Node.js 22+** 与 **pnpm 11.25.0**。克隆仓库并启动第一个示例：

```sh
git clone https://github.com/payAgain/codex-canvas.git
cd codex-canvas
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm build
pnpm canvas open examples/architecture.tsx
```

打开命令输出的本地预览链接，即可操作第一张画布。换成 `examples/call-graph.tsx`、`examples/sequence.tsx` 等路径，就能体验其他示例；`pnpm start` 打开完整工作台。

### 在 Codex 中使用

安装插件后，直接描述你需要的内容：

> 阅读这个项目，从请求入口画出关键函数的调用关系。点选函数时展示职责和源码位置，明确标出异常分支，不要猜测不存在的调用。

> 用 Codex Canvas 打开这个 TSX 文件，并跟随我后续的源码修改。

> 用 Codex Canvas 画出这个接口的时序图，展示调用与返回，支持切换成功、超时和重试路径。再用 UML 类图解释涉及的类与接口。

内置 [Canvas Skill](skills/canvas/SKILL.md) 会引导 Codex 编写、发布和打开画布。也可以点击工作台的「打开文件」。**聊天中的普通文件路径链接由 Codex 决定打开方式，可能打开外部编辑器；预览请使用 Canvas 的打开入口。**

## 安装到 Codex

需要支持插件的 **Codex 桌面端**，以及提供 `codex plugin` 命令的 **Codex CLI**。完成上方构建后：

```sh
pnpm package:release
node scripts/check-package.mjs
```

进入输出的 **`releaseRoot`** 目录，再注册并安装：

```sh
codex plugin marketplace add . --json
codex plugin add codex-canvas@codex-canvas-local --json
```

<details>
<summary>PowerShell：如何进入 releaseRoot？</summary>

在仓库根目录执行：

```powershell
$release = Get-Content .local/latest-release.json -Raw | ConvertFrom-Json
Set-Location $release.releaseRoot
```

`releaseRoot` 是生成的 marketplace 目录，不是仓库根目录。`check-package` 会安装锁定依赖，并检查 MCP 启动和示例编译。

</details>

<details>
<summary>已经取得 portable.zip？</summary>

解压到长期保留的目录，在 `plugins/codex-canvas/` 中运行：

```sh
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
```

回到包含 `INSTALL.md` 与 `.agents/` 的解压根目录，再执行上面的两条 `codex plugin` 命令。可移植包不包含 `node_modules`，首次安装依赖需要联网。

</details>

启用插件后开始新聊天。如果当前聊天仍使用旧服务，重新加载插件，必要时重启 Codex。安装、升级和发布细节见 [发布指南](docs/RELEASING.md)。

**当前状态：** 源码已在 GitHub 公开，首次 GitHub Release 尚未发布。1.0.0 已在 Windows x64 完成本地验收；跨平台 CI 检查构建与协议，Linux / macOS 原生界面仍待验证。原生面板和聊天操作取决于宿主能力，完整范围见 [验收记录](docs/releases/1.0.0.md)。

## 工作原理

### 一份源码，三个运行边界

上方架构图也是一份 [可交互的 Canvas 源码](examples/architecture.tsx)。它按执行环境分层，点击模块可以查看职责和代码位置。

| 运行边界 | 承担的工作 | 关键约束 |
|---|---|---|
| 本地 Node 服务 | 校验输入、类型检查、打包、版本与文件存储 | 编译生成模块，不执行生成的 React 代码 |
| 可信工作台 | 宿主桥接、画布切换、诊断、选区与状态协调 | 服务令牌和宿主 API 留在可信外壳 |
| 隔离 Canvas | 在 sandbox iframe 中执行 React 视图 | 只通过 SDK 使用组件与 hooks；不直接访问 Node 或宿主 |

画布是默认导出 React 组件的单文件 TSX / JSX，只从 <code>@codex-canvas/sdk</code> 导入。第三方组件封装在 renderer 后面。发布流程和版本保留规则可以通过 [时序图](examples/sequence.tsx) 与 [状态转换图](examples/state-machine.tsx) 交互查看。

### 一次局部修改如何完成

1. 在 Design mode 中选中元素，写下修改要求。
2. 用户明确发送后，工作台附上选区、画布身份与当前版本。
3. Codex 读取当前源码，修改对应部分并提交新版本。
4. 编译成功后更新视图；失败时保留最近成功画面并返回诊断。

发送选区需要宿主消息能力；浏览器模式用复制上下文完成交接。普通筛选只保存交互状态，不启动 AI。选区提供 DOM、文本及可选 part 标识，尚不是通用 AST 定位；版本检查避免旧修改覆盖新内容。

深入了解：[架构与数据流](docs/ARCHITECTURE.md) · [SDK 组件与状态](docs/SDK.md) · [安全边界](SECURITY.md)

## 数据与更新

1.1.0 默认将画布库放在 Codex 插件目录下的固定位置：

| Windows | macOS | Linux |
|---|---|---|
| `%USERPROFILE%/.codex/plugins/codex-canvas/data` | `~/.codex/plugins/codex-canvas/data` | `~/.codex/plugins/codex-canvas/data` |

「打开文件」直接浏览其中的 `canvases/`，可复制目录或源码路径、在系统文件管理器中打开目录，也可恢复已删除的画布。文件信息显示当前版本的真实源码路径。

首次使用新默认目录时会迁移旧版画布库，保留身份、源码历史、交互和删除状态，原目录保留。设置了 `CODEX_HOME` 时，目录位于该目录下的 `plugins/codex-canvas/data`；`CANVAS_DATA_DIR`、`--data-dir` 和显式 `dataDirectory` 仍优先。源码开发使用相同默认目录，`package:local` 继续保留原开发目录。

顶部「主题」可立即切换，工作台和画布同步更新，选择保存到 `preferences.json`。备份请复制整个数据目录。预览 URL 和 ready 文件包含本地会话凭据，请勿公开；数据处理边界见 [SECURITY.md](SECURITY.md)。本次更新范围与记录见 [画布目录与主题](docs/tasks/P1-LIBRARY-THEMES.md)。

## 文档导航

| 开始使用 | 理解与扩展 | 维护项目 |
|---|---|---|
| [使用与排错](docs/QUICKSTART.md) | [SDK 契约](docs/SDK.md) | [贡献指南](CONTRIBUTING.md) |
| [开发图表与补充示例](examples/README.md) | [架构设计](docs/ARCHITECTURE.md) | [发布指南](docs/RELEASING.md) |
| [兼容性与已知限制](docs/releases/1.0.0.md) | [Canvas Skill](skills/canvas/SKILL.md) | [更新日志](CHANGELOG.md) |

## 参与贡献

欢迎贡献实用画布、复现问题、改进交互与文档，或补充不同平台的兼容记录。提交问题时，请附版本、复现步骤和移除私人数据的最小示例。较大改动建议先通过 Issue 讨论；具体流程见 [CONTRIBUTING.md](CONTRIBUTING.md)。

```sh
pnpm build             # 构建工作台与插件
pnpm start             # 本地开发预览
pnpm check             # 类型、构建、回归与发布检查
pnpm package:release   # 生成可移植 marketplace
```

近期方向是平台兼容、局部源码定位与修改 Diff 预览。历史撤回、备份迁移和导出仍在规划中，详见 [路线图](docs/ROADMAP.md)。如果这个项目对你有用，欢迎 Star 或分享你的画布。

## 友情链接

- [LINUX DO - 新的理想型社区](https://linux.do/)

## 许可证与致谢

[MIT License](LICENSE)。感谢 `cursor-canvas-web`、React、Mantine、Recharts 和 MCP Apps 等开源项目，第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

Codex Canvas 参考了 Cursor Canvas 的交互体验，是独立开发的社区项目，与 OpenAI、Cursor 无官方隶属关系。
