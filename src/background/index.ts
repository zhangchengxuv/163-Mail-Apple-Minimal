import { createWeatherService } from './weather-service';
import {
  isSavedWeatherLocation,
  WEATHER_LOCATION_KEY,
  type WeatherRequest,
  type WeatherSource
} from '../shared/weather-types';

const weather = createWeatherService();

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const request = message as Partial<WeatherRequest>;
  if (request.type !== 'mail-minimal:weather:get') return;
  void resolveWeatherSource(request)
    .then((source) => weather.getWeather(source))
    .then(sendResponse)
    .catch(() => sendResponse({ weather: null, cacheState: 'unavailable' }));
  return true;
});

async function resolveWeatherSource(request: Partial<WeatherRequest>): Promise<WeatherSource> {
  if (request.locationMode !== 'geolocation') {
    return { mode: 'manual', city: typeof request.city === 'string' ? request.city : '' };
  }
  const result = await chrome.storage.local.get(WEATHER_LOCATION_KEY);
  const location = result[WEATHER_LOCATION_KEY];
  return { mode: 'geolocation', location: isSavedWeatherLocation(location) ? location : null };
}
