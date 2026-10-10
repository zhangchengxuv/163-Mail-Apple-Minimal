import { resolvedThemeForSettings, type ResolvedThemeMode } from './theme-mode';
import type { Settings } from './types';

/** Applies the extension UI palette without changing the persisted preference. */
export function applyExtensionTheme(
  settings: Pick<Settings, 'themeMode'>,
  root: HTMLElement = document.documentElement
): ResolvedThemeMode {
  const resolved = resolvedThemeForSettings(settings);
  root.setAttribute('data-mail-minimal-theme', resolved);
  root.setAttribute('data-mail-minimal-theme-mode', settings.themeMode);
  return resolved;
}
