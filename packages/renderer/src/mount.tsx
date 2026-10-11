import { Component, useEffect, type ComponentType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import './canvas.css';

function send(type: string, extra = {}) { parent.postMessage({ type, channel: window.__CANVAS_BOOT__.channel, ...extra }, '*'); }
class Boundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error) { send('render-error', { message: error.message }); }
  render() { return this.state.error ? <p role="alert">视图运行失败：{this.state.error}</p> : this.props.children; }
}
function Ready({ children }: { children: ReactNode }) {
  useEffect(() => { send('render-ready'); }, []);
  return children;
}
export function mount(Canvas: ComponentType) {
  window.addEventListener('error', event => send('render-error', { message: event.message }));
  window.addEventListener('unhandledrejection', event => send('render-error', { message: String(event.reason) }));
  createRoot(document.getElementById('root')!).render(
    <MantineProvider forceColorScheme={window.__CANVAS_BOOT__.theme} theme={{
      fontFamily: "Inter, 'Segoe UI', 'Microsoft YaHei', sans-serif",
      fontSizes: { xs: '12px', sm: '14px', md: '14px' },
      lineHeights: { xs: '16px', sm: '20px', md: '20px' },
      headings: { fontWeight: '590', sizes: {
        h1: { fontSize: '24px', lineHeight: '30px' },
        h2: { fontSize: '18px', lineHeight: '24px' },
        h3: { fontSize: '16px', lineHeight: '22px' },
      } },
    }}>
      <Boundary><Ready><Canvas /></Ready></Boundary>
    </MantineProvider>);
}
