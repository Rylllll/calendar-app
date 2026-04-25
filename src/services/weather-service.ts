import { WeatherSnapshot } from '@/types/domain';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

const weatherLabel: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  61: 'Rain',
  63: 'Heavy rain',
  71: 'Snow',
  95: 'Storm',
};

export async function fetchWeatherSnapshot(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Weather lookup failed');
  }

  const data = (await response.json()) as OpenMeteoResponse;
  return {
    temperature: Math.round(data.current.temperature_2m),
    condition: weatherLabel[data.current.weather_code] ?? 'Unsettled',
    windSpeed: Math.round(data.current.wind_speed_10m),
    fetchedAt: new Date().toISOString(),
  };
}
