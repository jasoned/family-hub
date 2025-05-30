import axios from 'axios';

// Base URL for OpenWeatherMap API
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Default API key as fallback only if user hasn't provided one
const DEFAULT_API_KEY = '1635890035cbba097fd5c26c8ea672a1';

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

export async function fetchWeather(location: string, apiKey?: string): Promise<WeatherData> {
  try {
    // Use provided API key or fallback to default
    const effectiveApiKey =
      apiKey ||
      // Try to get from localStorage directly as a backup
      localStorage.getItem('weatherApiKey') ||
      DEFAULT_API_KEY;

    // Check if input is a US ZIP code (5 digits)
    const isUSZip = /^\d{5}$/.test(location.trim());

    // Set parameters based on input type (ZIP or city name)
    const params = isUSZip
      ? {
          zip: `${location.trim()},us`,
          appid: effectiveApiKey,
          units: 'imperial',
        }
      : {
          q: location,
          appid: effectiveApiKey,
          units: 'imperial', // Use imperial units for Fahrenheit
        };

    const response = await axios.get(`${BASE_URL}/weather`, { params });

    const data = response.data;

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name,
    };
  } catch (error: any) {
    console.error('Error fetching weather data:', error);

    // Handle specific error cases
    if (error.message && error.message.includes('API key is required')) {
      throw new Error(error.message);
    } else if (error.response) {
      // Axios error with response
      if (error.response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key in Settings.');
      } else if (error.response.status === 404) {
        throw new Error('Location not found. Please check your spelling or try a nearby city.');
      } else if (error.response.status === 429) {
        throw new Error('API call limit reached. Please try again later.');
      } else {
        throw new Error(
          `Weather service error (${error.response.status}): ${error.response.data.message || 'Unknown error'}`,
        );
      }
    } else if (error.request) {
      // Request made but no response received
      throw new Error('Cannot connect to weather service. Please check your internet connection.');
    } else {
      // Something else went wrong
      throw error;
    }
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
