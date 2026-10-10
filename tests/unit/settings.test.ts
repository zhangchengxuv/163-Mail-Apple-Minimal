import { describe, expect, it } from 'vitest';
import { getSettings, resetSettings, updateSettings } from '../../src/shared/settings';
import { DEFAULT_SETTINGS } from '../../src/shared/constants';

describe('settings storage', () => {
  it('persists a setting and restores defaults', async () => {
    await updateSettings({ cleanerEnabled: false, customAccent: '#112233', accentColor: 'custom', showWeather: false, weatherCity: '  Beijing  ' });
    expect((await getSettings()).cleanerEnabled).toBe(false);
    expect((await getSettings()).customAccent).toBe('#112233');
    expect((await getSettings()).showWeather).toBe(false);
    expect((await getSettings()).weatherCity).toBe('Beijing');
    expect(await resetSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
