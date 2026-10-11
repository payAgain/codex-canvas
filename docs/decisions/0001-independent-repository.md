# 0001：独立主仓库与渲染器复用

状态：采用。日期：2026-10-10。

## 背景

目标是 Codex 插件，工作包括生成规则、MCP 工具、编译诊断、状态、宿主交互和元素反馈。`cursor-canvas-web` 已有可独立引用的组件库和运行时，宿主动作与状态需要适配。

## 决策

- 在当前目录独立维护主仓库。
- 将第三方兼容层通过 renderer 包接入，生成源码使用自己的 SDK。
- 首先使用固定版本依赖；内部改动无法通过适配解决时，维护独立 renderer Fork。
- 研究用开源仓库留在本地，主 Git 仓库跟踪调研报告和来源。

## 影响

主仓库能按产品职责组织，组件仍可复用。需要维护自己的稳定接口和上游适配表。
Fork 渲染器时应记录提交来源、内部改动和更新策略，保留上游许可。

## 依据

- [仓库路线比较](../research/repository-choice.am.md)
- [组件库构建配置](https://github.com/thisismydesign/cursor-canvas-web/blob/8d1a172aba11ea5520b11c701c8bd1fa773409d1/vite.lib.config.ts)
