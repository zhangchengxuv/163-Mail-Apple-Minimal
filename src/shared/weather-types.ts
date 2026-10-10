export type WeatherCacheState = 'fresh' | 'stale' | 'unavailable';

export interface WeatherSummary {
  city: string;
  temperatureC: number;
  apparentTemperatureC?: number;
  humidity?: number;
  weatherCode: number;
  description: string;
  symbol: string;
  updatedAt: number;
}

export interface WeatherLookupResult {
  weather: WeatherSummary | null;
  cacheState: WeatherCacheState;
}

export interface WeatherRequest {
  type: 'mail-minimal:weather:get';
  city: string;
}

export const WEATHER_CACHE_KEY = 'mail-minimal-weather-cache-v1';
