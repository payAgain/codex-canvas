# Windows 本机插件安装记录

日期：2026-10-10。版本：0.1.0。用户明确要求打包并直接安装到 Codex。

**后续更正（0.2.0）：** 本机 Codex 日志表明 0.1.0 的绝对 stdio command 被插件加载器拒绝。因此，下列“安装成功、启用、MCP 启动”仅分别证明安装注册与独立客户端握手，不证明 Codex 已加载工具。0.2.0 改为裸 `node` 命令，详见 [文件打开记录](../tasks/P1-FILE-OPEN.md)。

## 已确认

| 项目 | 实际结果 |
|---|---|
| 构建 | `pnpm build` 完成，包含 TypeScript 编译检查 |
| 暂存 | [package-local.mjs](../../scripts/package-local.mjs) 复制应用文件白名单 |
| 运行依赖 | 暂存目录通过 npm 安装 172 个包，包含 TypeScript 和 Windows esbuild 可执行文件 |
| 插件标识 | `codex-canvas@codex-canvas-local`，版本 0.1.0 |
| Codex 安装 | `codex plugin add` 返回安装路径；`plugin list` 返回 installed 和 enabled 均为 true |
| MCP 启动 | 从安装缓存启动 stdio 服务，协议初始化完成，stderr 为空 |
| 工具发现 | 返回 canvas_probe、canvas_publish、canvas_open、canvas_read、canvas_list、canvas_update、canvas_ui |
| App 资源 | 返回 `ui://codex-canvas/app.html`，MIME 为 `text/html;profile=mcp-app` |
| 数据位置 | MCP 使用本项目 `.canvas-data/`，安装包不含用户画布数据 |

安装检查发现 Windows 动态导入不接受磁盘路径字符串。启动器现使用 `entry.href` 加载构建产物，并已重新安装。上述 MCP 启动记录来自修复后的安装副本。

本机发布目录与 ZIP 位置记录在被忽略的 `.local/latest-release.json`。包包含运行依赖，固定了本机 Node 及数据路径；不属于跨机器通用分发包。

## 尚未确认

这次记录覆盖打包、安装、启用和 MCP 启动，不代表桌面原生 App 展示或消息回传已通过。新聊天加载插件、宿主变量展开、iframe CSP、原生上下文及消息能力，仍需按 [手动验收清单](../QUICKSTART.md) 实际观察。

未添加或运行测试套件。P1 完整功能验收与 P3 公开分发保持开放。

接口参考：[OpenAI 插件打包文档](https://developers.openai.com/plugins/build/plugins)。本机命令以当前 `codex plugin --help` 为准。


## 0.3.0 更新

0.3.0 已重新打包并安装启用。Skill、host-bridge、app.html 与仓库版本哈希一致；独立 Codex app-server 仍可发现 10 个工具。新 CLI 的浏览器预览展示成功。当前聊天既有 MCP 连接保持在 0.2.0，原生修复需新连接加载后观察；不能将插件列表已升级等同于旧卡片已经更新。

设计、截图缺陷和交付证据见 [Cursor 风格记录](../tasks/P1-CURSOR-STYLE.md)。


## 0.3.1 更新

已安装并启用。MCP 服务键改为版本化的 `codex-canvas-v0-3-1`，界面 URI 改为 `ui://codex-canvas/0.3.1/app.html`。Codex app-server 列出该服务和 10 个工具；安装产物哈希一致。关闭 MCP 自动尺寸上报，嵌入卡片固定 600 px，并在首次 HTML 绘制时应用边界。原生界面实际验收仍开放；此前旧聊天连接和历史卡片不能由安装命令原地替换。
