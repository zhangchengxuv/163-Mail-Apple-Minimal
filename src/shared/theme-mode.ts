import type { Settings, ThemeMode } from './types';

export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>;

export function resolveThemeMode(mode: ThemeMode, systemIsDark = false): ResolvedThemeMode {
  if (mode === 'system') return systemIsDark ? 'dark' : 'light';
  return mode;
}

export function systemThemeIsDark(windowRef: Pick<Window, 'matchMedia'> = window): boolean {
  return windowRef.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function resolvedThemeForSettings(
  settings: Pick<Settings, 'themeMode'>,
  windowRef: Pick<Window, 'matchMedia'> = window
): ResolvedThemeMode {
  return resolveThemeMode(settings.themeMode, systemThemeIsDark(windowRef));
}
