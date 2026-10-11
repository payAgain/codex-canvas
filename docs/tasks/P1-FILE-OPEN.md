# 0.2：文件打开与自动渲染

日期：2026-10-10。状态：功能实现完成；原生宿主展示保持待观察。

## 需求与行为

- `canvas_open_file` 接收明确的本机绝对 `path`、可选 `title` 和默认开启的 `watch`。只读取单文件 TSX / JSX，不执行源文件。
- 规范化后的文件路径关联稳定画布身份；重新打开复用状态与历史。文件跟随每 2 秒检查内容，外壳每 4 秒读取版本，更新通常在约 6 秒加编译时间内显示。
- 选择文件按钮导入内容快照；填写绝对路径可以持续跟随。画布编辑不会改写原文件。
- 编译错误保留最近成功构建。画布独立编辑后，后续文件变化返回 FILE_CONFLICT，不覆盖这次编辑。
- `node dist/cli.mjs open FILE` 自动启动或复用后台预览服务，并返回绑定到该画布的地址。未提供 FILE 时打开工作台。
- Canvas Skill 在用户要求打开文件或创建画布后自动展示结果；MCP 不可用时走 CLI 和 Codex 浏览器面板。

目前支持导入项目 SDK 的画布文件。相对模块、外部 npm 包、HTML 和其他文件类型不在此次兼容范围内。

## 原生接入

使用固定依赖 `@openai/mcp-extensions` 0.1.0。`canvas_view_file` 声明 TSX / JSX 文件入口。可信外壳接收宿主提供的文件名和 resourceUri，经宿主资源接口读取源码及订阅更新；生成代码始终在隔离 iframe 内运行。

`canvas_connect` 为没有初始工具结果的 thread / file 入口颁发界面会话，避免外壳一直等待画布绑定。不会推断桌面聊天 ID。文件更新、筛选及自动渲染不发送 Agent 消息。

官方文件入口支持不等于本机 Codex 已展示原生画布。本次不会宣称改变 Codex 内置编辑器，也不绕过缺失的宿主扩展。

## 已有证据

- 本机 Codex 日志记录 0.1.0 配置错误：stdio command 必须是裸命令名或插件内的 `./` 路径；原包使用绝对 Node 路径，被加载器拒绝。
- 0.2.0 打包器改用裸 `node`，保留外置数据目录。此前“插件已安装”和独立 MCP 握手不足以证明宿主成功加载，旧安装记录已补充这一点。
- `pnpm build` 完成 TypeScript 检查和应用构建。
- 用新 CLI 实际打开仓库架构示例，返回已发布 r1、空诊断、文件来源和浏览器预览地址；后台服务已启动。
- 0.2.0 安装结果为 installed / enabled；本机 Codex app-server 的 `mcpServerStatus/list` 已列出 codex-canvas 和 10 个工具，包含 canvas_open_file。这项记录经过 Codex 加载器，不是直接绕过配置启动 MCP。
- 在 Codex 内置浏览器实际看到「打开文件」按钮、文件来源标识和架构图，显示源码 r1 / 已发布 r1。
- 原生文件打开请求返回 queued，尚无原生文件查看器的实际展示证据；不据此判断成功或不支持。
- 未添加或运行测试套件。原生 UI、资源订阅和编辑冲突的完整交互验收仍待执行。

接口依据：[官方扩展文档](https://developers.openai.com/plugins/build/extensions)、[官方打包文档](https://developers.openai.com/plugins/build/plugins)。

## 0.3.1：聊天中的预览入口

用户确认点击聊天回复中的 TSX 文件路径会打开 VS Code。该操作没有经过 `canvas_open_file`；声明原生文件查看入口不能证明普通 Markdown 源码链接会被它接管。

Canvas Skill 已改为把工具返回的 `previewUrl` 作为「预览画布」主链接，并通过 `open_in_codex` 的浏览器目标展示；已有原生画布可见时不重复打开面板。需要源码时另附「查看源码」。失效预览通过明确文件路径或画布 ID 重新打开，不拼造协议地址。

官方配置文档的 `desktop.custom_file_handlers` 为「打开方式」菜单添加目标，没有说明它能按 TSX 扩展名接管聊天链接并在原生面板渲染。本次不修改全局编辑器设置，也不宣称历史文件链接的行为已改变。依据：[文件打开设置](https://learn.chatgpt.com/docs/developer-settings)、[自定义文件处理器](https://learn.chatgpt.com/docs/config-file/config-advanced#add-custom-file-handlers)。
