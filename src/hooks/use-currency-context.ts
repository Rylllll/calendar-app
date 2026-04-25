import { useMemo } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { resolveCurrencyContext } from '@/utils/locale';

export function useCurrencyContext() {
  const planner = usePlanner();

  return useMemo(() => {
    if (planner.activeTrip) {
      return {
        currency: planner.activeTrip.currencyCode,
        locale: resolveCurrencyContext(
          planner.activeTrip.destination.countryCode,
          planner.activeTrip.destination.country,
        ).locale,
        country:
          planner.activeTrip.destinationCountry ??
          planner.activeTrip.destination.country ??
          null,
      };
    }

    const context = resolveCurrencyContext(
      planner.deviceLocation?.countryCode,
      planner.deviceLocation?.country,
    );

    return {
      ...context,
      country: planner.deviceLocation?.country ?? null,
    };
  }, [planner.activeTrip, planner.deviceLocation?.country, planner.deviceLocation?.countryCode]);
}
