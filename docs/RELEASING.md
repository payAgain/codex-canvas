# 发布与安装包维护

当前发行版本：1.1.1。发行资产与安装说明见 [本版本记录](releases/1.1.1.md)，历史验收见 [1.0.0](releases/1.0.0.md)。源码仓库为 `payAgain/codex-canvas`。

## 下载与安装

从 [GitHub Releases](https://github.com/payAgain/codex-canvas/releases/latest) 下载可移植 ZIP 和 `SHA256SUMS.txt`。同一 ZIP 适用于 Windows、macOS、Linux；需要 Node.js 22+、Codex 桌面端插件支持与 Codex CLI。解压到长期保留的目录，从解压根目录执行：

```sh
cd plugins/codex-canvas
npm ci --omit=dev --ignore-scripts --no-audit --no-fund
cd ../..
codex plugin marketplace add . --json
codex plugin add codex-canvas@codex-canvas-local --json
```

同名 marketplace 已指向旧目录时，先用 `codex plugin marketplace list --json` 核对，然后移除旧注册再添加新路径；画布数据位于安装目录之外。重新加载插件后确认 `canvas_list.runtimeVersion`；进行中的聊天可能保留旧进程，必要时重启 Codex。

校验下载文件：

```sh
# Linux
sha256sum --check SHA256SUMS.txt
# macOS
shasum -a 256 --check SHA256SUMS.txt
```

PowerShell 中用 `Get-FileHash ./codex-canvas-1.1.1-portable.zip -Algorithm SHA256`，与校验文件中的值比较。

## 构建与归档

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm package:release
node scripts/check-package.mjs
pnpm release:archive
```

`pnpm check` 包含类型、生产构建、隔离数据回归、文档链接与清单检查。`check-package.mjs` 从发布锁文件安装依赖，并在临时库中启动真实 MCP 服务编译示例；不会操作用户库。

`package:release` 在 `.local/releases/` 创建 marketplace 与插件目录。`release:archive` 根据 `.local/latest-release.json` 生成 `.local/public/<version>/codex-canvas-<version>-portable.zip` 与 `SHA256SUMS.txt`。Unix 需要 zip/unzip；Windows 需要 PowerShell 7。原 [PowerShell 归档入口](../scripts/archive-release.ps1) 仍可使用。

归档白名单包括 `INSTALL.md`、`.agents/` 和 `plugins/` 中的公开插件文件，保留隐藏清单与许可证，排除 `node_modules`、用户数据和内部 `release.json`。脚本拒绝本机专用包、符号链接、版本不匹配和同名资产覆盖。可移植包首次使用需联网安装依赖；安装时无需 pnpm 或本地构建。

默认库位于 Codex 用户目录的固定 `plugins/codex-canvas/data`，升级首次迁移旧库并保留原目录。`package:local` 会写入本机绝对路径，不可公开发布；`.local/latest-release.json` 也不能上传。

## 标签触发发布

1. 更新发布版本、插件清单与锁文件，并准备 `docs/releases/<version>.md`。中英文 README 的下载文件名与当前发行状态同步更新。
2. 提交并推送到仓库，等待普通 CI 的三平台检查通过。
3. 为经过检查的具体提交创建对应标签并推送。当前版本示例：

```sh
git tag -a v1.1.1 -m "Codex Canvas v1.1.1"
git push origin v1.1.1
```

[发布工作流](../.github/workflows/release.yml) 校验已有稳定版本标签与 package.json 一致、同版本说明存在，然后复用 [CI](../.github/workflows/ci.yml)，执行 Windows、Linux、macOS 的构建、回归、锁定依赖安装与归档检查。全部通过后才发布 Linux 作业生成的通用 ZIP 和 SHA-256 文件；说明中的仓库相对链接会转换为标签对应的 GitHub 链接。

普通源码推送不会创建 Release；只有版本标签或手动 Release 工作流会触发。手动运行需提供已存在的标签，例如 `v1.1.1`。不自动覆盖已经发布的同名资产，也不移动已有标签。若工作流重试遇到已存在的发行版，先检查远程 Release 状态再处理。

普通 CI 与构建作业仅有 contents 读取权限，只有通过检查后的发布作业获得 contents 写权限，使用 GitHub 内置 token，无需额外 PAT。跨平台 CI 检查协议与安装产物；真实原生 UI 与聊天能力仍按宿主版本单独记录。
