import { useEffect, useState } from "react";
import { fetchWeather } from "../services/weatherService";

// Pass a location prop, e.g., "Thatcher, AZ" or "85552"
export default function WeatherWidget({ location }: { location: string }) {
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeather(null);
    setError(null);

    if (!location) {
      setError("Enter a city or ZIP code to see the weather.");
      return;
    }

    fetchWeather(location)
      .then((data) => setWeather(data))
      .catch((err) => setError(err.message));
  }, [location]);

  if (error) return <div className="text-red-500">{error}</div>;
  if (!weather) return <div>Loading weather…</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold">
        {weather.name}, {weather.sys?.country}
      </h2>
      <div>
        {Math.round(weather.main?.temp)}°F,
        {weather.weather?.[0]?.main}
      </div>
      <div>
        <span>Humidity: {weather.main?.humidity}%</span>
      </div>
      {/* Add more weather details as you like */}
    </div>
  );
}
