# 发布与 GitHub 准备

当前本地开发版本：1.1.0。1.0.0 的公开发布准备与验收记录保留。上传、创建远程仓库和发布 Release 是单独操作；本地准备不会自动执行它们。

## 构建与检查

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm audit --prod
pnpm package:release
node scripts/check-package.mjs
```

`pnpm check` 包含类型检查、应用构建、隔离数据回归测试、文档链接、清单与常见凭据/私人路径检查。扫描不是完整的秘密检测保证；上传前还需查看 Git 暂存内容。

`pnpm package:release` 在 `.local/releases/` 生成可移植 marketplace：`.agents/plugins/marketplace.json` 与 `plugins/codex-canvas/`。运行依赖由 `release/package-lock.json` 锁定，`check-package.mjs` 使用 `npm ci` 安装并从暂存包启动真实 MCP 服务编译样例。它不修改用户画布。

在 PowerShell 7 中执行 `./scripts/archive-release.ps1`，生成 `.local/public/1.0.0/codex-canvas-1.0.0-portable.zip` 和 `SHA256SUMS.txt`。归档仅含 marketplace、安装说明和插件白名单文件，不含 `node_modules`、用户数据或内部打包记录。脚本拒绝覆盖同名资产，也拒绝归档本机专用包。

首次下载不含 `node_modules` 的包时，在 `plugins/codex-canvas/` 执行 `npm ci --omit=dev --ignore-scripts --no-audit --no-fund`。预编译的 Windows x64 依赖包只能直接用于对应平台；其他平台使用无依赖的可移植包，重新安装依赖。所有平台仍需要 Node.js 22+。

正式包配置 Codex 插件目录下的固定画布库 `plugins/codex-canvas/data`，升级不依赖版本缓存路径，首次迁移旧库并保留原目录。`pnpm package:local` 仅用于维护本机已有 `.canvas-data`；它写入本机绝对路径，**不得作为公开资产上传**。本地打包记录 `.local/latest-release.json` 同样不能上传。

## 安装

在解压后的 marketplace 根目录，或 `package:release` 返回的 `releaseRoot` 中执行：

```sh
codex plugin marketplace add . --json
codex plugin add codex-canvas@codex-canvas-local --json
```

若同名 marketplace 已指向另一目录，先用 `codex plugin marketplace list --json` 核对，然后移除旧注册再添加新路径；不要删除画布数据。重新加载插件后确认 `canvas_list` 的 `runtimeVersion`。进行中的聊天可能保留旧进程，必要时重启 Codex。新版服务保留早期卡片入口。

## 上传前

1. 查看 [本次验收记录](releases/1.0.0.md) 与 [更新说明](../CHANGELOG.md)，准确说明仍未观察的宿主能力。
2. 确认 MIT 是维护者选定的许可证，保留 `LICENSE`、第三方声明和依赖许可文件。
3. 检查 `git status --short`、`git diff --cached --stat` 与暂存文件列表；不得包含 `.canvas-data`、`.local`、`.env`、日志、研究副本、依赖目录和用户生成报告。
4. 在 GitHub 选择实际仓库名、所有者和可见性。使用实际仓库地址配置 `origin`，不要把研究资料中的仓库地址当成本项目地址。
5. 上传本地提交后等待 CI。CI 提供 Windows/Linux/macOS 构建与协议检查，但不自动证明各平台的 Codex 原生 UI 行为。
6. 创建 `v1.0.0` 标签和 GitHub Release，填写 [发布说明](releases/1.0.0.md)。可上传无依赖的可移植包、对应平台依赖包及 SHA-256 校验文件；不要上传本机专用包或内部 `release.json`。

源码仓库为 `payAgain/codex-canvas`。CI 使用只读权限，没有自动发布密钥；源码推送不自动创建标签或 GitHub Release，发行包需维护者另行发布。

接口参考：[OpenAI 插件打包](https://developers.openai.com/plugins/build/plugins)、[GitHub checkout](https://github.com/actions/checkout)、[GitHub Node.js 环境](https://github.com/actions/setup-node)。
