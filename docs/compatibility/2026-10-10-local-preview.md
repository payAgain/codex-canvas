# 本机接入观察：2026-10-10

证据类别：文档接口、代码实现与实际观察分别列出。

## 实际观察

- Node.js 22.23.1，pnpm 11.25.0，Windows / PowerShell。
- 本地 HTTP 服务已启动，只监听 127.0.0.1。
- Codex 内置浏览器已打开工作台并列出已发布的画布。
- 报告 iframe 中实际出现标题、357 项统计、92% 完成率、趋势图与明细表。这些数值来自演示数据。
- 浏览器模式没有 MCP App 的父宿主握手；不能据此推断 Codex 原生 MCP App 不支持。
- 当前聊天工具列表没有本项目的 canvas_probe 等工具，没有通过原生宿主调用本项目服务。
- 已在工作台点击「保存观察」，服务端返回成功；[脱敏后的记录](browser-probe.json) 保留原始时间与状态，省略界面实例 ID。
- 真实项目报告也已实际打开，显示本仓库 5 个模块、15 个源码文件与 774 行的采集快照。

## 能力矩阵

| 能力 | 状态 | 依据 / 未观察原因 |
|---|---|---|
| 本地浏览器显示画布 | supported | 启动链接已打开，DOM 显示报告 |
| 浏览器 HTTP 与保存列表 | supported | 页面列出实际 CLI 发布的报告 |
| iframe 渲染 React 与图表 | supported | 报告 DOM 与可视页面已出现 |
| 原生工具 UI | unknown | 本项目 MCP 尚未在该聊天加载 |
| 原生 thread 入口 | unknown | 元数据已实现，无原生打开结果 |
| 原生 hostInfo / theme | unknown | 未完成原生 initialize，不推断版本 |
| 原生 UI → 工具 | unknown | 实现 canvas_ui，无原生调用结果 |
| 模型上下文更新 | unknown | 未在原生宿主点击对应按钮 |
| 原生消息发送 | unknown | 未发送测试消息，只允许明确动作 |
| 草稿扩展 | unknown | 首版未接入 OpenAI 草稿扩展适配器 |
| 原生资源订阅 / 文件动作 | unknown | 首版以轮询和浏览器复制路径运行 |
| 界面实例隔离 | 部分实现、待完整验收 | bootstrap 颁发独立令牌；未做多会话串用验收 |

## 文档与实现依据

- [OpenAI MCP App 快速开始](https://developers.openai.com/plugins/build/app-quickstart) 描述可选 UI 与 MCP 服务。
- [OpenAI 扩展](https://developers.openai.com/plugins/build/extensions) 描述 thread entrypoint，不代表所有宿主实现。
- [OpenAI 插件打包](https://developers.openai.com/plugins/build/plugins) 描述可移植与兼容清单。
- 固定 SDK 1.32.1 与 ext-apps 1.7.5。后者 peer 依赖与 SDK 1.x 相容，未混用要求 SDK 2.x 的 ext-apps 2.0.3。

## P1 路线

采用本地浏览器展示，使用画布级上下文复制反馈。
保留 MCP App 与 thread 元数据，用于安装后的原生观察。原生失败不会禁用浏览器路径。
绑定仅使用 workspaceId、canvasId 和服务端界面令牌，不推测桌面聊天 ID。

启动日志和本机数据位于忽略目录，文档不记录会话令牌。「宿主能力」可保存标准化记录到数据根 probes/；记录保留功能状态和布尔能力，不保存聊天内容或认证数据。
