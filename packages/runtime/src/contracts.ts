export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export const themePreferences = ['system', 'light', 'paper', 'mist', 'dark', 'midnight'] as const;
export type ThemePreference = typeof themePreferences[number];
export interface CanvasPreferences { theme: ThemePreference; }
export interface CanvasLibrary {
  canvases: Manifest[]; deleted: Manifest[]; workspaceId: string;
  dataDirectory: string; canvasDirectory: string; sourcePaths: Record<string, string>; preferences: CanvasPreferences;
}
export interface Diagnostic { phase: 'policy' | 'typecheck' | 'bundle'; message: string; file: string; line?: number; column?: number; }
export interface Manifest {
  canvasId: string; workspaceId: string; title: string; sdkVersion: '0.1';
  sourceRevision: number; publishedRevision: number | null; buildHash: string | null;
  createdAt: string; updatedAt: string; diagnostics: Diagnostic[];
  deletedAt?: string;
  sourceFile?: { path: string; hash: string; watch: boolean; importedRevision: number };
}
export interface CanvasState { stateRevision: number; values: Record<string, Json>; }
export interface CanvasDocument { manifest: Manifest; source: string; sourcePath: string; state: CanvasState; bundle?: string; css?: string; rendererDiagnostics?: Diagnostic[]; }
export interface PublishResult { ok: boolean; manifest: Manifest; diagnostics: Diagnostic[]; }
export interface PartSelection {
  domPath: string; tag: string; text: string; label: string; partId?: string | undefined;
}
export interface CanvasFeedback {
  feedbackId: string; canvasId: string; workspaceId: string; sourceRevision: number; publishedRevision: number;
  createdAt: string; selection: PartSelection; request: string;
  sourceLocation?: { line: number; column: number; match: 'unique-text' };
}
export class CanvasError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
