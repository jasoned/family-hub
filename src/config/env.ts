// Environment configuration
// This file is committed to version control and provides default values
// For local development, create a .env file in the project root

// Debug logging
console.log('Environment variables:', import.meta.env);

// Weather API configuration
export const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
export const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Debug logging for weather configuration
console.log('Weather API Key loaded:', WEATHER_API_KEY ? '****' + WEATHER_API_KEY.slice(-4) : 'Not set');

// Check if required environment variables are set in development
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_WEATHER_API_KEY) {
    console.warn('Warning: VITE_WEATHER_API_KEY is not set. Weather features will be disabled.');
  }
}

// Export all environment variables for type safety
export const env = {
  WEATHER_API_KEY,
  WEATHER_API_URL,
} as const;
