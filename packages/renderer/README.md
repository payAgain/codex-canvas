# Canvas Renderer

固定依赖 cursor-canvas-web 0.3.0、Mantine 7.17.8 与 Recharts 2.15.4。
[src/components.tsx](src/components.tsx) 提供组件适配；[src/mount.tsx](src/mount.tsx) 在隔离浏览器视图挂载 React。
不依赖 MCP 传输、Node 存储或宿主桥接。可信外壳位于 mcp-server 的 ui 目录。
