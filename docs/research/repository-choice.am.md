---
title: Canvas 插件应该新建仓库还是 Fork
subtitle: 主仓库独立，组件复用，修改范围决定是否 Fork
template: sheet
theme: blueprint
lang: zh
cols: 2
---

## A 推荐新建主仓库，复用渲染组件

```callout ok 针对你的 Codex 插件
新建自己的插件主仓库。
先把 cursor-canvas-web 作为渲染依赖。
需要深改组件时，再单独 Fork 渲染器。
```

这是基于项目目标和已读源码的架构判断。
你的主要工作包括宿主桥接、编译诊断和独立存储。
还需要 Skill、反馈协议、历史版本和元素批注。
这些模块由插件主仓库组织更直接。

cursor-canvas-web 已将组件和运行时打包为独立入口。
其库构建排除了演示站点，外置 React 和 Mantine 依赖。
因此可以通过库接入，保留自己的产品结构。
[包接口](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/package.json)
[库构建配置](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/vite.lib.config.ts)

## B 三种路线的成本

| 路线 | 起步收益 | 长期成本 | 适用目标 |
|---|---|---|---|
| 新建主仓库，引用兼容层 | 复用图表和表格，产品结构独立 | 维护宿主适配和 SDK 包装层 | 推荐用于你的插件 |
| 直接 Fork cursor-canvas-web | 立即改组件、主题和 Hooks | 同时改造 Web 项目与插件结构 | 首要目标是增强兼容层 |
| Fork OpenCanvas 整体应用 | 获得空间画布、组件协议和应用界面 | 适配现有 Agent、应用与 Codex | 目标是独立空间工作台 |

这些成本是设计判断，尚未测量开发工时。
如果仅做一个可运行的展示样例，Fork 兼容层也很直接。
如果计划长期维护 Codex 插件，建议独立主仓库。

OpenCanvas 的定位可见 [项目说明](https://github.com/ashark-ai-05/opencanvas)。
兼容层的定位可见 [项目说明](https://github.com/thisismydesign/cursor-canvas-web)。

## C 建议的仓库结构

以下名称是结构示意，尚未创建仓库。

```tree
your-canvas-plugin/
  插件清单与 MCP 配置 | 按宿主支持的格式打包
  skills/canvas/ | 触发规则、生成约束、示例
  packages/
    sdk/ | 对模型暴露稳定组件和 Hooks
    renderer/ | 包装开源兼容层与宿主主题
    runtime/ | 编译、诊断、版本和状态存储
    mcp-server/ | 发布、读取、更新和反馈工具
    host-bridge/ | MCP Apps、消息和上下文适配
  examples/ | 报告、图表、代码审查样例
  docs/ | 设计、兼容表、来源与许可
```

让 Agent 只依赖自己的 SDK 模块名。
组件底座通过 renderer 接入，便于后续替换。
主题、持久化和宿主动作由自己的适配层控制。
包装是否足够，需通过具体组件确认。

Fork 的触发条件是修改开始深入渲染器内部。
例如，需要改变表格行为、图表事件或 Diff 渲染。
此时将兼容层维护为单独的 Fork 包，主仓库继续引用它。
固定版本，记录改动，保留原有许可与署名。

## D 开发先后顺序

1. 确认当前宿主能打开界面并回传明确动作。
2. 接入兼容层，展示一个真实数据报告。
3. 加入类型诊断、更新和最近成功版本。
4. 加入画布独立状态、保存和重开。
5. 加入元素定位、批注和 AI 修改。

宿主原生扩展的支持情况仍需运行验证。
它决定侧栏接入路径，但不妨碍主仓库独立组织。

最终建议：以独立插件仓库作为产品入口。
先复用组件库，再按实际修改范围决定是否维护 Fork。
