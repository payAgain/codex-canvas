# P1：首个可直接试用版本

日期：2026-10-10。状态：实现已交付，完整验收待执行。

## 范围

采用 P0 确定的本地浏览器路径，交付创建、编辑、诊断、保存和重开能力。
原生 MCP App 作为可选适配，不以原生扩展未知阻塞首版。

| 任务 | 实现 |
|---|---|
| 类型与身份 | [contracts](../../packages/runtime/src/contracts.ts) |
| 受限编译 | [compiler](../../packages/runtime/src/compiler.ts) |
| 存储与版本 | [store](../../packages/runtime/src/store.ts) |
| SDK 与状态 | [SDK](../../packages/sdk/src/index.tsx) |
| 渲染隔离与外壳 | [可信 UI](../../packages/mcp-server/src/ui/shell.ts) |
| 宿主桥接 | [host-bridge](../../packages/host-bridge/src/index.ts) |
| 工具与界面绑定 | [MCP 服务](../../packages/mcp-server/src/index.ts) |
| 生成流程 | [Canvas Skill](../../skills/canvas/SKILL.md) |

## 已发生的结果

- `pnpm install` 已完成，锁文件固定版本。esbuild 是唯一允许安装构建脚本的依赖。
- `pnpm build` 已成功，包括项目 TypeScript 检查和 Node/UI 构建。
- 首次示例发布返回真实类型诊断：状态 Hook 将字符串推断为字面量，无法传给 Select。
- 修正 Hook 后，三张示例通过 update 发布为 r2，诊断为空。失败源码 r1 仍保留。
- `pnpm demo` 从实际仓库源码生成并发布项目统计报告，诊断为空。
- 已在 Codex 内置浏览器打开报告，实际显示统计、趋势图和表格。
- 后台预览进程持续运行，用户可直接打开提供的入口。

这些记录不是测试套件结果。尚未执行恢复、冲突、隔离和失败后保留视图的完整验收。

## 数据落盘

```text
.canvas-data/
  workspace.json
  canvases/<canvasId>/
    manifest.json
    source/<revision>.tsx
    builds/<sha256>.json
    state.json
  probes/<probeId>.json
```

builds 中是浏览器 JS 和 CSS，不会作为 Node 模块加载。manifest 记录成功编译版本；运行时错误由外壳单独显示。
文件写锁覆盖 MCP 与 CLI 进程。只以 manifest 提交的版本为准；崩溃遗留的未提交源码不被读取为当前版本。

## 验收入口

按 [QUICKSTART](../QUICKSTART.md) 执行手动验收。完成后再更新路线图的整体验收状态。
