import { useEffect, useState } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { fetchWeatherSnapshot } from '@/services/weather-service';

export function useWeather() {
  const planner = usePlanner();
  const [loading, setLoading] = useState(false);
  const activeTrip = planner.activeTrip;
  const updateWeatherSnapshot = planner.updateWeatherSnapshot;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeTrip) {
        return;
      }

      if (activeTrip.weather) {
        return;
      }

      try {
        setLoading(true);
        const snapshot = await fetchWeatherSnapshot(
          activeTrip.destination.latitude,
          activeTrip.destination.longitude,
        );
        if (!cancelled) {
          updateWeatherSnapshot(activeTrip.id, snapshot);
        }
      } catch {
        // Keep cached/local-first state when offline.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    activeTrip,
    activeTrip?.destination.latitude,
    activeTrip?.destination.longitude,
    activeTrip?.id,
    activeTrip?.weather,
    updateWeatherSnapshot,
  ]);

  return {
    loading,
    weather: activeTrip?.weather,
  };
}
