export { Page, Section, RelationshipGraph, H1, H2, H3, Text, Code, Stack, Row, Grid, Divider, Spacer,
  Card, CardHeader, CardBody, Stat, Pill, Callout, Table, Button, Select, LineChart, BarChart, PieChart, DiffView, DiffStats, Link, useHostTheme,
} from '../../renderer/src/components.js';
export { useState, useEffect, useMemo, useCallback, useRef } from 'react';
export type { ReactNode, CSSProperties } from 'react';
import { useSyncExternalStore, useCallback } from 'react';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
declare global {
  interface Window { __CANVAS_BOOT__: { channel: string; values: Record<string, Json>; theme: 'light' | 'dark' }; }
}
const listeners = new Set<() => void>();
const initial = typeof window === 'undefined' ? {} : window.__CANVAS_BOOT__?.values ?? {};
let values: Record<string, Json> = { ...initial };
if (typeof window !== 'undefined') window.addEventListener('message', event => {
  if (event.source !== parent || event.data?.channel !== window.__CANVAS_BOOT__?.channel || event.data?.type !== 'state-sync') return;
  values = event.data.values; listeners.forEach(fn => fn());
});
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

/** State is scoped and persisted by the trusted shell, never by localStorage. */
export function useCanvasState<T>(key: string, defaultValue: T): [T, (value: T | ((previous: T) => T)) => void] {
  if (!Object.prototype.hasOwnProperty.call(values, key)) values[key] = defaultValue as Json;
  const value = useSyncExternalStore(subscribe, () => values[key]) as T;
  const set = useCallback((next: T | ((previous: T) => T)) => {
    const updated = typeof next === 'function' ? (next as (previous: T) => T)(values[key] as T) : next;
    values = { ...values, [key]: updated as Json }; listeners.forEach(fn => fn());
    parent.postMessage({ type: 'state-patch', channel: window.__CANVAS_BOOT__.channel, key, value: updated }, '*');
  }, [key]);
  return [value, set];
}
