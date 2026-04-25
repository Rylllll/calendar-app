import { addDays, isAfter, startOfDay } from 'date-fns';
import { startTransition, useCallback, useMemo, useState } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import {
  openDeviceCalendarEvent,
  syncDeviceCalendar,
} from '@/services/calendar-service';

export function useDeviceCalendar() {
  const planner = usePlanner();
  const [loading, setLoading] = useState(false);
  const setDeviceCalendarPermission = planner.setDeviceCalendarPermission;
  const syncDeviceCalendarData = planner.syncDeviceCalendarData;
  const clearDeviceCalendarSync = planner.clearDeviceCalendarSync;

  const syncPhoneCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await syncDeviceCalendar({
        startDate: addDays(startOfDay(new Date()), -14),
        endDate: addDays(startOfDay(new Date()), 60),
      });

      startTransition(() => {
        setDeviceCalendarPermission(payload.permission);
        if (payload.permission === 'granted' && payload.syncedAt) {
          syncDeviceCalendarData(payload.calendars, payload.events, payload.syncedAt);
          return;
        }
        clearDeviceCalendarSync();
      });

      return payload;
    } finally {
      setLoading(false);
    }
  }, [clearDeviceCalendarSync, setDeviceCalendarPermission, syncDeviceCalendarData]);

  const upcomingDeviceEvents = useMemo(
    () =>
      planner.deviceCalendarEvents.filter((event) =>
        isAfter(new Date(event.end), new Date()),
      ),
    [planner.deviceCalendarEvents],
  );

  return {
    loading,
    syncPhoneCalendar,
    openNativeEvent: openDeviceCalendarEvent,
    deviceCalendarPermission: planner.deviceCalendarPermission,
    deviceCalendars: planner.deviceCalendars,
    deviceCalendarEvents: planner.deviceCalendarEvents,
    deviceCalendarLastSyncedAt: planner.deviceCalendarLastSyncedAt,
    upcomingDeviceEvents,
  };
}
