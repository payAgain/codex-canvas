# Canvas Runtime

实现导入约束、TypeScript 检查、esbuild 浏览器打包、文件版本与状态存储。
生成模块只编译，不在 Node 执行。所有进程写入经过数据目录写锁；manifest 原子替换。
源码失败版本与最近成功编译版本分别保留。详细结构见 [架构](../../docs/ARCHITECTURE.md)。
