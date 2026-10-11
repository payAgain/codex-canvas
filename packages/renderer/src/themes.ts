import type { ThemePreference } from '../../runtime/src/contracts.js';

export type ThemeId = Exclude<ThemePreference, 'system'>;
// Plain theme data can be shared with the trusted shell without importing React,
// Mantine or a third-party renderer into the host bridge.
export interface CanvasTheme {
  id: ThemeId; label: string; description: string; kind: 'light' | 'dark';
  bg: string; chrome: string; sidebar: string; fg: string; muted: string; quiet: string;
  line: string; fill: string; accent: string; hover: string; onAccent: string;
  noticeBg: string; noticeFg: string;
}
export const canvasThemes: readonly CanvasTheme[] = [
  { id: 'light', label: '亮白', description: '清晰明亮，适合代码与图表', kind: 'light',
    bg: '#ffffff', chrome: '#f7f9fc', sidebar: '#f0f3f8', fg: '#1c2735', muted: '#566478', quiet: '#758392',
    line: '#cbd4e0', fill: '#edf2f9', accent: '#3266c7', hover: '#2855ae', onAccent: '#ffffff', noticeBg: '#fff5df', noticeFg: '#785600' },
  { id: 'paper', label: '暖纸', description: '柔和米色，适合长篇阅读', kind: 'light',
    bg: '#fbf7ed', chrome: '#f2ecdf', sidebar: '#efe8d9', fg: '#34312b', muted: '#666051', quiet: '#877f6d',
    line: '#d9cfbb', fill: '#ece4d2', accent: '#9b672d', hover: '#82551f', onAccent: '#fffaf0', noticeBg: '#f5e9cd', noticeFg: '#76531e' },
  { id: 'mist', label: '青雾', description: '低饱和青绿，适合持续探索', kind: 'light',
    bg: '#f0f7f6', chrome: '#e9f2f0', sidebar: '#e3eeeb', fg: '#233b37', muted: '#506c66', quiet: '#6c8680',
    line: '#c7dbd5', fill: '#deebe7', accent: '#287568', hover: '#1f6156', onAccent: '#ffffff', noticeBg: '#f3edd7', noticeFg: '#766122' },
  { id: 'dark', label: '石墨黑', description: '中性深灰，减少环境亮度', kind: 'dark',
    bg: '#181a1d', chrome: '#141619', sidebar: '#17191d', fg: '#e5e9ef', muted: '#afb6c2', quiet: '#858e9d',
    line: '#353b44', fill: '#282e37', accent: '#79a9ec', hover: '#93bcf5', onAccent: '#142136', noticeBg: '#332d20', noticeFg: '#e8c57e' },
  { id: 'midnight', label: '午夜蓝', description: '深蓝底色，适合夜间工作', kind: 'dark',
    bg: '#141b2b', chrome: '#101724', sidebar: '#171f30', fg: '#e4ebfb', muted: '#adbad3', quiet: '#8090ae',
    line: '#34425c', fill: '#253049', accent: '#98adf9', hover: '#b3c3ff', onAccent: '#17213d', noticeBg: '#332d28', noticeFg: '#ebca94' },
];

export function resolveTheme(preference: ThemePreference, host: 'light' | 'dark'): CanvasTheme {
  const id = preference === 'system' ? host : preference;
  return canvasThemes.find(t => t.id === id) ?? canvasThemes[0]!;
}

export function themeTokens(t: CanvasTheme) {
  return {
    bg: { editor: t.bg, chrome: t.chrome, elevated: t.bg },
    text: { primary: t.fg, secondary: t.muted, tertiary: t.quiet, quaternary: t.quiet, link: t.accent, onAccent: t.onAccent },
    stroke: { primary: t.line, secondary: t.line, tertiary: t.line },
    fill: { primary: t.fill, secondary: t.fill, tertiary: t.fill, quaternary: t.fill },
    accent: { primary: t.accent, control: t.accent, controlHover: t.hover },
    diff: t.kind === 'dark' ? { insertedLine: '#3fa26633', removedLine: '#b8004933', stripAdded: '#3fa2668f', stripRemoved: '#fc6b838f' }
      : { insertedLine: '#1f8a651f', removedLine: '#cf2d5614', stripAdded: '#1f8a65cc', stripRemoved: '#cf2d56cc' },
  };
}
