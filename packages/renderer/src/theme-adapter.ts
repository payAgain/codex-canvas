import { canvasPaletteDark, canvasPaletteLight, canvasTokens, canvasTokensLight } from '@thisismydesign/cursor-canvas-web';
import { themeTokens, type CanvasTheme } from './themes.js';

export function configureRendererTheme(t: CanvasTheme) {
  const tokens = themeTokens(t);
  // The pinned library exposes these token objects publicly. Adapt them before
  // mounting, inside this canvas's isolated iframe only. Its primitives and
  // our SDK's useHostTheme therefore read the same palette as custom diagrams.
  Object.assign(t.kind === 'dark' ? canvasTokens : canvasTokensLight, tokens);
  Object.assign(t.kind === 'dark' ? canvasPaletteDark : canvasPaletteLight, {
    foreground: t.fg, foregroundSecondary: t.muted, foregroundTertiary: t.quiet, foregroundQuaternary: t.quiet,
    editor: t.bg, chrome: t.chrome, sidebar: t.sidebar, elevated: t.bg,
    fillPrimary: t.fill, fillSecondary: t.fill, fillTertiary: t.fill, fillQuaternary: t.fill,
    strokePrimary: t.line, strokeSecondary: t.line, strokeTertiary: t.line,
    accent: t.accent, buttonBackground: t.accent, buttonHoverBackground: t.hover, buttonForeground: t.onAccent, link: t.accent,
  });
  const variables: Record<string, string> = {
    '--canvas-bg': t.bg, '--canvas-fg': t.fg, '--canvas-secondary': t.muted, '--canvas-line': t.line, '--canvas-fill': t.fill, '--canvas-accent': t.accent,
  };
  for (const [key, value] of Object.entries(variables)) document.documentElement.style.setProperty(key, value);
  document.documentElement.style.colorScheme = t.kind;
}
