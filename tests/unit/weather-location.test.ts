import { describe, expect, it } from 'vitest';
import { WEATHER_LOCATION_KEY } from '../../src/shared/weather-types';
import { getSavedWeatherLocation, saveCurrentWeatherLocation } from '../../src/options/weather-location';

describe('weather location settings', () => {
  it('stores an explicitly requested browser position locally', async () => {
    const geolocation = {
      getCurrentPosition: (success: PositionCallback) => success({
        coords: { latitude: 1.3521, longitude: 103.8198 }
      } as GeolocationPosition)
    } as Geolocation;

    const saved = await saveCurrentWeatherLocation(geolocation);

    expect(saved).toMatchObject({ latitude: 1.3521, longitude: 103.8198, label: '当前位置' });
    await expect(getSavedWeatherLocation()).resolves.toEqual(saved);
    const local = await chrome.storage.local.get(WEATHER_LOCATION_KEY);
    expect(local[WEATHER_LOCATION_KEY]).toEqual(saved);
  });

  it('reports a clear error when browser geolocation is unavailable', async () => {
    await expect(saveCurrentWeatherLocation(undefined)).rejects.toThrow('定位在此浏览器中不可用');
  });
});
