# GitHub 发行与下载入口

日期：2026-10-11。状态：首个 v1.1.1 发行完成，标记为 Latest；三平台 CI、标签发布工作流与远端资产下载校验通过。

## 需求

用户指出 GitHub Releases 为空，要求完善。首次发行使用当前版本 v1.1.1，不补发未经对应版本检查的历史标签。

## 实现

- 发布可移植 marketplace ZIP 与 SHA-256 校验文件，包内保留隐藏的 marketplace / plugin 清单、已构建工作台、SDK、示例、安装说明、许可证和锁文件。
- 归档排除依赖目录、用户库、内部打包记录和私人目录，拒绝本机专用包与同名资产覆盖。Unix 使用 zip/unzip，Windows 使用 PowerShell 7/.NET。
- CI 保留三平台构建、现有回归和独立安装包检查，增加归档检查；发布工作流复用同一 CI，只在全部通过后上传发行资产。
- 版本标签必须对应 package.json 版本，并具有同版本发布说明。只有发布作业拥有 contents 写权限；普通 CI 保持只读，不使用额外 PAT。
- 中英文首页增加 Release 下载与直接安装入口，更新发行状态、更新日志和维护者发布说明。

## 证据

- 既有功能提交的 Windows、Linux、macOS CI 已全部通过，包含 22 项回归和可移植安装包检查。
- 本次不新增测试套件。发布清单、文档链接和 YAML 静态检查通过；本机可移植包从锁文件安装依赖、独立 stdio 启动和真实 TSX 编译通过。
- 本机归档包含 134 个白名单文件，ZIP 内容与清单一致，解压完整性与 SHA-256 校验通过。依赖目录、用户数据及内部打包记录未进入归档。
- 发布准备提交 `ea066be` 的普通 CI `38144260947` 在 Windows、Linux、macOS 全部通过，包括新增归档步骤。
- 标签 `v1.1.1` 指向同一提交。Release 工作流 `38144562071` 的版本验证、三平台检查和发布作业全部通过；2026-10-11 22:48（Asia/Tokyo）发布为正式 Latest 发行。
- 实际远端资产：`codex-canvas-1.1.1-portable.zip`（1,060,958 字节）与 `SHA256SUMS.txt`，均处于 uploaded 状态。下载后的 ZIP 包含 134 个文件，CRC、公开清单、版本与 SHA-256 校验通过，未包含依赖目录、用户数据或内部打包记录。
- 远端 ZIP 的 SHA-256：`3fa717c92e560436b26d3968c73d03631c187b75ac992076ed57c42e3a02b29a`，与校验文件和 GitHub 资产 digest 一致。
- [发行页面](https://github.com/payAgain/codex-canvas/releases/tag/v1.1.1) 提供中英文说明；文档相对链接已转换为对应标签的 GitHub 地址。

文件：[发行说明](../releases/1.1.1.md)、[发布流程](../../.github/workflows/release.yml)、[跨平台归档](../../scripts/archive-release.mjs)。
