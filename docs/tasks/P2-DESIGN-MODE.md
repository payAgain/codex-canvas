# 0.4：原生面板、局部修改与画布管理

日期：2026-10-10。状态：0.4 原生侧边面板已实际出现；聊天操作待实际观察。0.4.1 修复旧卡片升级兼容。

用户要求继续推进原生侧边面板、Design mode 和删除功能，因此在 P1 完整验收仍开放时实施这部分 P2/P3 工作。

## 原生显示

- 工具声明 `preferredModelDisplayMode: fullscreen`；UI 资源声明 `preferredDisplayMode: fullscreen` 和 `availableDisplayModes: [fullscreen]`，避免默认展示大幅聊天内卡片。
- 保留 thread / file 入口。连接后读取真实 `displayMode`，在宿主声明支持时请求展开，使用返回模式布局。协议 fullscreen 的具体位置由宿主决定，不能称为插件已接管 Codex 侧栏。
- 扩展面板填满宿主容器，聊天内回退仍固定 600 px；关闭自动尺寸反馈。紧凑工具栏，窄面板列表改为竖向抽屉，不再挤成横向滚动条。
- 浏览器仍是能力缺失时的独立回退，不模拟或隐藏浏览器地址栏来冒充原生面板。

## Design mode

- 可信外壳切换 Design mode；独立脚本在生成视图的 sandbox iframe 中描边和选择 DOM 元素，支持点击、选父层、Esc 清除。
- 选区只携带限长的 DOM 路径、标签、文本和可选 `data-canvas-part`。外壳验证消息来源、随机 channel、当前画布和版本；不会因为 iframe 发消息就启动 Agent。
- 用户可把选区作为模型上下文添加到聊天，或填写请求后明确发送。仅当宿主声明对应能力时启用按钮；浏览器提供复制选区。
- 当前固定的 OpenAI Extensions 0.1.0 消息 schema 仅允许 `send: true`，不支持写入草稿。本实现不传未经支持的 `send: false`，不声称能够直接替换输入框内容。
- 点击添加/发送/复制时，由服务端核对 source/published revision，保存反馈到画布自己的 `feedback/`。版本变化拒绝旧选择，切换/更新/重建视图清除选择。
- 可选源码行号来自发布版本中的唯一精确文本匹配，不是 AST/source map。动态文本可能没有行号；Agent 仍需读取并定位源码。生成代码不导入 Node、不访问文件或宿主桥。
- 文件跟随画布优先由 Agent 编辑明确源文件，其他画布用乐观锁更新。Skill 要求保留选区外内容和交互。

不含拖拽框选、图像批注、通用 AST 映射或自动执行任意选中文本。

## 删除与恢复

- 列表逐项提供删除按钮，以及已删除列表/恢复。使用 manifest 的 `deletedAt` 标记，原身份、源码历史、构建和状态保留；不删除源 TSX / JSX 文件。
- 删除与恢复使用文件锁和当前源码版本。读取、更新和状态写入拒绝已删除画布；默认列表和文件跟随跳过它们。
- watcher 在读取文件到提交之间发生删除时，使用原 ID 提交，不能隐式创建替代画布。用户明确重新打开源文件则可创建新画布。
- CLI 支持 `list --deleted`、`delete ID --base N`、`restore ID --base N`；MCP 提供同名操作工具。

## 已有证据与剩余事项

- `pnpm build` 已完成类型检查和应用构建。
- 新 CLI 实际打开用户提供的 Cursor 示例，复用已有画布和状态，返回空诊断。
- 浏览器回退已实际展示 0.4.0 的紧凑工具栏、Design mode、逐项删除按钮和已删除入口；本次未代用户发送消息或删除既有画布。
- 0.4.0 已安装到本机插件缓存；Codex app-server 经过插件加载器发现 `codex-canvas-v0-4-0` 和 12 个工具，包含删除与恢复。这确认服务可加载，不证明原生 UI 已出现。
- 初次安装时聊天仍连接 0.3.1；随后 0.4.0 工具已加载。实际调用 `canvas_open` 后，宿主日志记录 `displayMode=fullscreen` 和 `widget_running`；MCP Apps 侧边面板清单出现 Canvas，DOM 可读到画布标题、Design mode 与「MCP App 已连接」。面板布局为 `panel`，生成视图约 452 × 598 px。
- 用户报告的「未能显示」来自旧卡片引用已移除的 `codex-canvas-v0-3-1`，日志明确为 `unknown MCP server`；不是新面板的编译错误。0.4.1 固定主服务名并保留旧服务/资源入口，原生连接不复用历史令牌。见 [升级兼容记录](../compatibility/2026-10-10-upgrade-identity.md)。
- 遵循项目要求，未添加或运行测试套件。待用户执行：原生打开、上下文附件/发送、局部修改结果、删除恢复与其他窗口同步。

接口依据：[官方扩展](https://developers.openai.com/plugins/build/extensions)、[UI 资源显示模式](https://developers.openai.com/plugins/reference)。固定 SDK 的类型定义是实现参数的补充依据。
