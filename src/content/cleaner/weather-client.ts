import type { WeatherLocationMode, WeatherLookupResult, WeatherRequest } from '../../shared/weather-types';

const unavailable = (): WeatherLookupResult => ({ weather: null, cacheState: 'unavailable' });

export async function requestWeather(locationMode: WeatherLocationMode, city: string): Promise<WeatherLookupResult> {
  if (!globalThis.chrome?.runtime?.sendMessage) return unavailable();
  const request: WeatherRequest = { type: 'mail-minimal:weather:get', locationMode, city };
  try {
    const result = await chrome.runtime.sendMessage(request) as WeatherLookupResult | undefined;
    if (!result || !('cacheState' in result)) return unavailable();
    return result;
  } catch {
    return unavailable();
  }
}
