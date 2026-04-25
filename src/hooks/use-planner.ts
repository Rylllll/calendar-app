import { useMemo } from 'react';

import { usePlannerStore } from '@/store/planner-store';
import { sanitizeTrips } from '@/services/trip-sanitizer-service';
import { isSameCalendarDay } from '@/utils/date';

export function usePlanner() {
  const state = usePlannerStore();
  const trips = useMemo(() => sanitizeTrips(state.trips), [state.trips]);
  const activeTrip = useMemo(
    () => trips.find((trip) => trip.id === state.activeTripId),
    [state.activeTripId, trips],
  );
  const selectedDayEvents = useMemo(
    () => state.events.filter((event) => isSameCalendarDay(event.start, state.selectedDate)),
    [state.events, state.selectedDate],
  );

  return {
    ...state,
    trips,
    activeTrip,
    selectedDayEvents,
  };
}
