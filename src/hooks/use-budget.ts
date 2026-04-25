import { useMemo } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { calculateBudgetInsights } from '@/services/travel-heuristics';
import { resolveCurrencyContext } from '@/utils/locale';

export function useBudget() {
  const planner = usePlanner();
  const insights = useMemo(
    () => calculateBudgetInsights(planner.budgetEntries, planner.activeTrip),
    [planner.activeTrip, planner.budgetEntries],
  );
  const currencyContext = useMemo(
    () =>
      planner.activeTrip
        ? resolveCurrencyContext(
            planner.activeTrip.destination.countryCode,
            planner.activeTrip.destination.country,
          )
        : resolveCurrencyContext(
            planner.deviceLocation?.countryCode,
            planner.deviceLocation?.country,
          ),
    [
      planner.activeTrip,
      planner.deviceLocation?.country,
      planner.deviceLocation?.countryCode,
    ],
  );

  return {
    ...planner,
    ...insights,
    currencyCode: planner.activeTrip?.currencyCode ?? currencyContext.currency,
    currencyLocale: currencyContext.locale,
  };
}
