import { addDays, startOfDay } from 'date-fns';
import { useMemo } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import { DeviceCalendarEvent, PlannerEvent } from '@/types/domain';
import { isSameCalendarDay } from '@/utils/date';

export function useCalendar() {
  const planner = usePlanner();

  const days = useMemo(() => {
    const start = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => addDays(start, index).toISOString());
  }, []);

  const agenda = useMemo(() => {
    const baseEvents = planner.tripModeEnabled
      ? planner.events.filter((event) => !event.hiddenInTripMode || event.relatedTripId === planner.activeTripId)
      : planner.events;
    return baseEvents.filter((event) => isSameCalendarDay(event.start, planner.selectedDate));
  }, [planner.activeTripId, planner.events, planner.selectedDate, planner.tripModeEnabled]);

  const deviceAgenda = useMemo(
    () =>
      planner.deviceCalendarEvents.filter((event) =>
        isSameCalendarDay(event.start, planner.selectedDate),
      ),
    [planner.deviceCalendarEvents, planner.selectedDate],
  );

  const combinedAgenda = useMemo(
    () =>
      [...agenda, ...deviceAgenda.map(mapDeviceCalendarEventToTimelineItem)].sort(
        (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
      ),
    [agenda, deviceAgenda],
  );

  return {
    days,
    agenda,
    deviceAgenda,
    combinedAgenda,
    selectedDate: planner.selectedDate,
    setSelectedDate: planner.setSelectedDate,
  };
}

function mapDeviceCalendarEventToTimelineItem(event: DeviceCalendarEvent): PlannerEvent {
  return {
    id: `device-${event.id}`,
    title: event.title,
    start: event.start,
    end: event.end,
    category: 'synced',
    priority: 'medium',
    tags: ['device-calendar'],
    description: event.notes ?? event.location ?? undefined,
    hiddenInTripMode: false,
    source: 'device',
    sourceCalendarTitle: event.calendarTitle,
  };
}
