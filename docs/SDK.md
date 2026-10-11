# SDK 0.3：生成契约

画布是一个 TSX 文件，默认导出 React 组件，只从 `@codex-canvas/sdk` 导入。
不导入 React、Node、URL、第三方包或本地文件；自动 JSX runtime 由编译器提供。

```tsx
import { Stack, H1, Text, Row, Button, useCanvasState, useHostTheme } from '@codex-canvas/sdk';

export default function Canvas() {
  const theme = useHostTheme();
  const [count, setCount] = useCanvasState('count', 0);
  return <Stack gap={24} style={{ padding:24, maxWidth:960, margin:'0 auto' }}>
    <H1>探索报告</H1>
    <Text tone="secondary">一句结论或任务说明。</Text>
    <Row gap={12}>
      <Text>已点击 {count} 次</Text>
      <Button onClick={() => setCount(n => n + 1)}>增加一次</Button>
    </Row>
    <Text size="small" style={{ color:theme.text.tertiary }}>选择会保存在这张画布中。</Text>
  </Stack>;
}
```

## 组件

| 组件 | 参数 |
|---|---|
| `Page`（可选） | `title`, `subtitle?`, `children` |
| `Section`（可选） | `title`, `id?`, `children` |
| `H1` / `H2` / `H3` / `Code` | `children`, `style?` |
| `Text` | `tone?: primary / secondary / tertiary / quaternary`, `size?: body / small`, `weight?: normal / medium / semibold / bold`, `as?: p / span`, `italic?`, `truncate?`, `style?`, `children` |
| `Stack` / `Row` | `gap?`, `children`, `style?`；Row 还支持 `justify`, `align`, `wrap` |
| `Grid` | `columns: number / CSS grid-template-columns`, `gap?`, `align?`, `style?`, `children` |
| `Card` / `CardHeader` / `CardBody` | `children`, `style?`；Card 支持 `variant?: default / borderless`, `collapsible`, `defaultOpen`, `open`, `onOpenChange`；CardHeader 支持 `trailing` |
| `Stat` | `label`, `value`, `tone?: success / danger / warning / info`, `style?` |
| `Pill` | `children`, `active?`, `onClick?`, `size?: sm / md`, `leadingContent?`, `keyboardHint?`, `title?`, `style?`, `tone?: neutral / added / deleted / renamed / success / warning / info` |
| `Callout` | `title?`, `children`, `tone?: info / success / warning / danger / neutral` |
| `Table` | `headers: ReactNode[]`, `rows: ReactNode[][]`, `columnAlign?: (left / center / right)[]`, `rowTone?: (success / danger / warning / info / neutral)[]`, `framed?`, `striped?`, `stickyHeader?`, `style?`, `emptyMessage?` |
| `Button` | `children`, `onClick?`, `disabled?`, `variant?: primary / secondary / ghost` |
| `Select` | `value?`, `onChange?(value: string)`, `options: {value,label}[]` |
| `LineChart` / `BarChart` | `categories: string[]`, `series: {name,data:number[],tone?}[]`, `height?`, `valueSuffix?`, `style?`；LineChart 支持 `fill?`；BarChart 支持 `stacked?`, `horizontal?`, `normalized?` |
| `PieChart` | `data: {label,value,tone?}[]`, `size?`, `donut?` |
| `RelationshipGraph` | `nodes: {id,label,detail?}[]`, `edges: {from,to,label?}[]`, `selected?`, `onSelect?(id)` |
| `Link` | `href`, `children`, `style?`；外部资料链接，显示为普通链接 |
| `Divider` / `Spacer` | 布局分隔与填充 |

完整类型以 [renderer 接口](../packages/renderer/src/components.tsx) 和固定依赖的 `.d.ts` 为准。
`DiffView` / `DiffStats` 已透传，但首版审查示例以发现列表为主。
关系图使用自动网格布局，适合少量模块；首版不提供拖拽和复杂图布局。

## 视觉与主题

默认遵循紧凑的 Cursor Canvas 构图：H1 24/30、H2 18/24、H3 16/22、正文 14/20、小字 12/16；布局间距通常为 8、12、16、24。Page 不再附加品牌眉题或大标题。优先用 Stack / Row / Grid 自由组合，不强制使用 Page / Section。

`useHostTheme()` 随当前浅色/深色模式返回：

- `kind`: `light` / `dark`。
- `bg`: `editor`, `chrome`, `elevated`。
- `text`: `primary`, `secondary`, `tertiary`, `quaternary`, `link`, `onAccent`。
- `stroke`: `primary`, `secondary`, `tertiary`。
- `fill`: `primary`, `secondary`, `tertiary`, `quaternary`。
- `accent`: `primary`, `control`, `controlHover`。
- `diff`: `insertedLine`, `removedLine`, `stripAdded`, `stripRemoved`。

使用 `theme.text.secondary` 等标记，避免在画布内硬编码颜色。此接口通过 renderer 封装第三方实现；没有 Cursor 原生 SDK 的 `spacing`、`radius`、IDE 动作等扩展。间距与圆角直接使用数字。持久状态仍使用本项目的 `useCanvasState`，不是第三方 localStorage Hook。

1.1.0 工作台可选择亮白、暖纸、青雾、石墨黑、午夜蓝或跟随宿主。`kind` 仍返回 `light` / `dark`，token 返回当前选择的实际配色；标准组件与自定义 SVG 应使用同一套 token。主题偏好保存在画布库，不属于生成视图的状态键。

## Hooks 与状态

SDK 提供 `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`，以及自有 `useCanvasState<T>(key, initial)`。

- `useCanvasState` 的值必须为 JSON：字符串、有限数字、布尔、null、数组或普通对象。
- 键为 1–80 个英文字母、数字、点、短横线或下划线。禁止原型属性键。
- 单个值上限 32 KB；整张画布状态上限 128 KB。
- 默认值只在键不存在时使用。源码更新不会清空已有状态；变更数据类型时用新的键。
- 状态通过可信外壳写入文件，不依赖生成 iframe 的 localStorage。
- 多界面状态冲突时重新读取并重放当前键。其他键会保留；同一键最后成功提交的值生效。
- 外壳显示持久化成功或失败。请等到「交互状态已保存」后关闭窗口。

普通 `useState` 不会跨刷新保存。SDK 不暴露宿主消息和 MCP 调用。

## 运行边界

源码最多 256 KB；静态导入和重新导出只能指向 SDK。动态导入、require、直接 eval / Function、triple-slash 引用会返回策略诊断。
这些约束不是独立的安全沙箱。执行边界是无同源权限的 iframe、CSP 和受限消息协议。

视图不能联网、访问 Node、访问宿主或读取服务令牌。允许的视图消息只有渲染状态和本画布的状态键更新。
浏览器中的死循环仍可能阻塞当前预览页；首版没有 CPU 配额或独立渲染进程。不要把它当成面向不可信第三方的托管执行平台。
