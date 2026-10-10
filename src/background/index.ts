import { createWeatherService } from './weather-service';
import type { WeatherRequest } from '../shared/weather-types';

const weather = createWeatherService();

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const request = message as Partial<WeatherRequest>;
  if (request.type !== 'mail-minimal:weather:get') return;
  void weather.getWeather(typeof request.city === 'string' ? request.city : '')
    .then(sendResponse)
    .catch(() => sendResponse({ weather: null, cacheState: 'unavailable' }));
  return true;
});
