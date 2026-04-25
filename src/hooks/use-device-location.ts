import { startTransition, useCallback, useMemo, useState } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { buildMapsSearchUrl } from '@/services/maps-service';
import { syncDeviceLocation } from '@/services/location-service';

export function useDeviceLocation() {
  const planner = usePlanner();
  const [loading, setLoading] = useState(false);
  const setDeviceLocation = planner.setDeviceLocation;

  const syncCurrentLocation = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await syncDeviceLocation();
      startTransition(() => {
        setDeviceLocation(payload.permission, payload.snapshot);
      });
      return payload;
    } finally {
      setLoading(false);
    }
  }, [setDeviceLocation]);

  const mapsUrl = useMemo(() => {
    if (!planner.deviceLocation) {
      return null;
    }

    return buildMapsSearchUrl(planner.deviceLocation.label, planner.deviceLocation);
  }, [planner.deviceLocation]);

  return {
    loading,
    syncCurrentLocation,
    deviceLocation: planner.deviceLocation,
    deviceLocationPermission: planner.deviceLocationPermission,
    deviceLocationMapsUrl: mapsUrl,
  };
}
