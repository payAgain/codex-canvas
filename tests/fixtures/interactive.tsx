import { Stack, H1, Text, Button, useCanvasState } from '@codex-canvas/sdk';

export default function Canvas() {
  const [count, setCount] = useCanvasState('count', 0);
  return <Stack gap={20} style={{ padding: 24 }}>
    <H1>Canvas release check</H1>
    <div data-canvas-part="summary"><Text>This paragraph can be selected in Design mode.</Text></div>
    <Text>Count: {count}</Text>
    <Button onClick={() => setCount(n => n + 1)}>Increment</Button>
  </Stack>;
}
