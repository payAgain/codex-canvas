// Runs only inside the generated view's sandbox. It can report a selection,
// never call the host, send a chat message or read the filesystem.
import type { PartSelection } from '../../runtime/src/contracts.js';

let enabled = false;
let selected: Element | undefined, hovered: Element | undefined;
const overlay = document.createElement('div');
overlay.setAttribute('aria-hidden', 'true');
overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;display:none;box-sizing:border-box;border:2px solid #529fea;background:#529fea14;';
const label = document.createElement('span');
label.style.cssText = 'position:absolute;left:-2px;top:100%;max-width:320px;padding:3px 7px;color:white;background:#2675b9;font:12px/18px system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
overlay.append(label); document.body.append(overlay);
const channel = () => window.__CANVAS_BOOT__.channel;
function pathFor(element: Element) {
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node.id !== 'root' && parts.length < 30) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    parts.unshift(`${node.localName}:nth-child(${Array.from(parent.children).indexOf(node) + 1})`);
    node = parent;
  }
  return `#root > ${parts.join(' > ')}`;
}
function textFor(element: Element) {
  return (element instanceof HTMLElement ? element.innerText : element.textContent ?? '').trim().slice(0, 4000);
}
function describe(element: Element): PartSelection {
  const partId = element.closest('[data-canvas-part]')?.getAttribute('data-canvas-part')?.slice(0, 160);
  return { domPath: pathFor(element).slice(0, 2000), tag: element.localName.slice(0, 40), text: textFor(element),
    label: (partId || element.getAttribute('aria-label') || element.getAttribute('role') || element.localName).slice(0, 160),
    ...(partId ? { partId } : {}) };
}
function draw() {
  const target = hovered ?? selected;
  if (!enabled || !target?.isConnected) { overlay.style.display = 'none'; return; }
  const rect = target.getBoundingClientRect();
  Object.assign(overlay.style, { display: 'block', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  label.textContent = `${describe(target).label} · ${target.localName}${target === selected ? ' · 已选中' : ' · 点击选择'}`;
  label.style.top = rect.bottom + 28 > innerHeight ? '0' : '100%';
}
function pick(target: EventTarget | null) {
  if (!(target instanceof Element) || !document.getElementById('root')?.contains(target)) return undefined;
  let node = target.closest('svg') ?? target;
  while (node.getBoundingClientRect().height < 2 && node.parentElement && node.parentElement.id !== 'root') node = node.parentElement;
  return node.id === 'root' ? undefined : node;
}
function select(element?: Element) {
  selected = element; hovered = undefined; draw();
  parent.postMessage({ type: 'design-selection', channel: channel(), selection: element ? describe(element) : null }, '*');
}
window.addEventListener('message', event => {
  if (event.source !== parent || event.data?.channel !== channel()) return;
  if (event.data.type === 'design-mode') {
    enabled = event.data.enabled === true;
    if (!enabled) { selected = undefined; hovered = undefined; }
    document.documentElement.style.cursor = enabled ? 'crosshair' : '';
    draw();
  } else if (enabled && event.data.type === 'design-parent' && selected?.parentElement?.id !== 'root') select(selected?.parentElement ?? undefined);
  else if (event.data.type === 'design-clear') select();
});
document.addEventListener('pointermove', event => { if (enabled) { hovered = pick(event.target); draw(); } }, true);
document.addEventListener('pointerleave', () => { hovered = undefined; draw(); });
document.addEventListener('click', event => {
  if (!enabled) return;
  event.preventDefault(); event.stopImmediatePropagation(); select(pick(event.target));
}, true);
for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick', 'contextmenu']) document.addEventListener(type, event => {
  if (enabled) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
document.addEventListener('keydown', event => {
  if (!enabled) return;
  if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); select(); }
  else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopImmediatePropagation(); select(pick(event.target)); }
  else if (event.key !== 'Tab') { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
window.addEventListener('scroll', draw, true); window.addEventListener('resize', draw);
