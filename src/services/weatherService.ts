import axios from 'axios';
import { WEATHER_API_KEY, WEATHER_API_URL } from '../config/env';

// Fail hard at build time in production if the key is missing
if (import.meta.env.PROD && !WEATHER_API_KEY) {
  throw new Error('Missing VITE_WEATHER_API_KEY. Build aborted.');
}

// Base URL for OpenWeatherMap API, trimmed of trailing slashes and /weather
const BASE_URL = (WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5')
  .replace(/\/+$/, '')
  .replace(/\/weather$/, '');

// Get API key from environment variables or use an empty string if not set
const getApiKey = (): string => {
  if (WEATHER_API_KEY) return WEATHER_API_KEY;

  if (import.meta.env.DEV) {
    console.warn('No weather API key found. Weather features will be disabled.');
  }
  return '';
};

export interface WeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  location: string;
}

// In-memory cache
const weatherCache: Record<string, { data: WeatherData; timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Debounce helper
const debounce = <F extends (...args: any[]) => any>(fn: F, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => resolve(fn(...args)), delay);
    });
};

export const fetchWeather = debounce(
  async (location: string, apiKey?: string): Promise<WeatherData> => {
    if (!location) throw new Error('Location is required');

    // Cache lookup
    const cacheKey = location.toLowerCase();
    const cached = weatherCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      console.log('Returning cached weather data for:', location);
      return cached.data;
    }

    const effectiveApiKey = apiKey || getApiKey();
    if (!effectiveApiKey) {
      throw new Error(
        'No weather API key available. Please set VITE_WEATHER_API_KEY in your .env file.'
      );
    }

    console.log('Fetching fresh weather data for location:', location);

    const isUSZip = /^\d{5}$/.test(location.trim());
    const params = isUSZip
      ? { zip: `${location},us`, appid: effectiveApiKey, units: 'imperial' }
      : { q: location, appid: effectiveApiKey, units: 'imperial' };

    const url = `${BASE_URL}/weather`;

    try {
      const response = await axios.get(url, {
        params,
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status !== 200) {
        const errorMessage = response.data?.message || 'Failed to fetch weather data';
        switch (response.status) {
          case 401:
            throw new Error('Invalid API key. Please check your weather API key in settings.');
          case 404:
            throw new Error('Location not found. Please check the location and try again.');
          case 429:
            throw new Error('Too many requests. Please wait before trying again.');
          default:
            throw new Error(`Weather API error: ${errorMessage}`);
        }
      }

      if (!response.data?.main || !response.data.weather?.[0]) {
        console.error('Invalid weather data format:', response.data);
        throw new Error('Invalid response format from weather service');
      }

      const weatherInfo: WeatherData = {
        temp: Math.round(response.data.main.temp),
        feelsLike: Math.round(response.data.main.feels_like),
        tempMin: Math.round(response.data.main.temp_min),
        tempMax: Math.round(response.data.main.temp_max),
        humidity: response.data.main.humidity,
        windSpeed:
          response.data.wind?.speed !== undefined
            ? Math.round(response.data.wind.speed * 10) / 10
            : 0,
        condition: response.data.weather[0].main,
        description: response.data.weather[0].description
          .split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        icon: response.data.weather[0].icon,
        location: response.data.name || location,
      };

      weatherCache[cacheKey] = { data: weatherInfo, timestamp: Date.now() };

      console.log('Weather data retrieved:', {
        location: weatherInfo.location,
        temp: weatherInfo.temp,
        condition: weatherInfo.condition,
        description: weatherInfo.description,
      });

      return weatherInfo;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      }

      if (axios.isAxiosError(error)) {
        if (error.response) throw error;
        if (error.request) {
          console.error('No response from weather service:', error.request);
          throw new Error('Could not connect to weather service. Please check your internet connection.');
        }
      }

      console.error('Error fetching weather:', error);
      throw error instanceof Error ? error : new Error('Unexpected error while fetching weather data');
    }
  },
  1000
);

export const getWeatherIconUrl = (iconCode: string): string =>
  `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
