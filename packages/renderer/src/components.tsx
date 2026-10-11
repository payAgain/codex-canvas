// The third-party component surface stops here. Generated canvases import our SDK.
export { H1, H2, H3, Text, Code, Stack, Row, Grid, Divider, Spacer, Card, CardHeader, CardBody,
  Stat, Pill, Callout, Table, Button, Select, LineChart, BarChart, PieChart, DiffView, DiffStats, Link, useHostTheme,
} from '@thisismydesign/cursor-canvas-web';
import type { ReactNode } from 'react';

export function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <main className="canvas-page"><header className="canvas-heading"><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>{children}</main>;
}
export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section className="canvas-section" id={id}><h2>{title}</h2>{children}</section>;
}
export function RelationshipGraph({ nodes, edges, selected, onSelect }: {
  nodes: { id: string; label: string; detail?: string }[];
  edges: { from: string; to: string; label?: string }[];
  selected?: string; onSelect?: (id: string) => void;
}) {
  const columns = Math.min(3, Math.max(1, nodes.length));
  const rows = Math.ceil(nodes.length / columns);
  const width = columns * 250, height = rows * 150;
  const coords = new Map(nodes.map((n, i) => [n.id, { x: i % columns * 250 + 125, y: Math.floor(i / columns) * 150 + 65 }]));
  return <svg className="relationship-graph" viewBox={`0 0 ${width} ${height}`} role="group" aria-label="模块关系图">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
    {edges.map((e, i) => { const a = coords.get(e.from), b = coords.get(e.to); if (!a || !b) return null;
      const dx = b.x - a.x, dy = b.y - a.y, ratio = 1 / Math.max(Math.abs(dx) / 101, Math.abs(dy) / 34, 1);
      return <g key={i} className="graph-edge"><line x1={a.x + dx * ratio} y1={a.y + dy * ratio} x2={b.x - dx * ratio} y2={b.y - dy * ratio} markerEnd="url(#arrow)" /><text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8}>{e.label}</text></g>;
    })}
    {nodes.map(n => { const p = coords.get(n.id)!; return <g key={n.id} role="button" tabIndex={0} aria-label={n.label} aria-pressed={selected === n.id}
      onClick={() => onSelect?.(n.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(n.id); } }}
      className={`graph-node ${selected === n.id ? 'selected' : ''}`}><rect x={p.x - 100} y={p.y - 32} width="200" height="64" rx="10" /><text x={p.x} y={p.y + 5}>{n.label}</text></g>; })}
  </svg>;
}
