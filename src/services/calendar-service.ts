import { addDays, startOfDay } from 'date-fns';
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

import {
  DeviceCalendarEvent,
  DeviceCalendarPermission,
  DeviceCalendarSource,
} from '@/types/domain';

interface SyncOptions {
  startDate?: Date;
  endDate?: Date;
}

export interface DeviceCalendarSyncPayload {
  available: boolean;
  permission: DeviceCalendarPermission;
  calendars: DeviceCalendarSource[];
  events: DeviceCalendarEvent[];
  syncedAt: string | null;
}

export async function syncDeviceCalendar(
  options: SyncOptions = {},
): Promise<DeviceCalendarSyncPayload> {
  const available = await isDeviceCalendarAvailable();
  if (!available) {
    return {
      available: false,
      permission: 'unavailable',
      calendars: [],
      events: [],
      syncedAt: null,
    };
  }

  const permission = await ensureDeviceCalendarPermission();
  if (permission !== 'granted') {
    return {
      available: true,
      permission,
      calendars: [],
      events: [],
      syncedAt: null,
    };
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const normalizedCalendars = calendars
    .filter((calendar) => calendar.isVisible !== false)
    .map<DeviceCalendarSource>((calendar) => ({
      id: calendar.id,
      title: calendar.title,
      color: calendar.color ?? '#CFC6FF',
      ownerAccount: calendar.ownerAccount ?? null,
      isPrimary: calendar.isPrimary ?? false,
      allowsModifications: calendar.allowsModifications,
      isVisible: calendar.isVisible ?? true,
    }))
    .sort((left, right) => {
      if (left.isPrimary && !right.isPrimary) {
        return -1;
      }
      if (!left.isPrimary && right.isPrimary) {
        return 1;
      }
      return left.title.localeCompare(right.title);
    });

  if (!normalizedCalendars.length) {
    return {
      available: true,
      permission: 'granted',
      calendars: [],
      events: [],
      syncedAt: new Date().toISOString(),
    };
  }

  const startDate = options.startDate ?? addDays(startOfDay(new Date()), -14);
  const endDate = options.endDate ?? addDays(startOfDay(new Date()), 60);
  const events = await Calendar.getEventsAsync(
    normalizedCalendars.map((calendar) => calendar.id),
    startDate,
    endDate,
  );

  const calendarsById = new Map(normalizedCalendars.map((calendar) => [calendar.id, calendar]));
  const normalizedEvents = events
    .map<DeviceCalendarEvent>((event) => {
      const calendar = calendarsById.get(event.calendarId);
      return {
        id: event.id,
        calendarId: event.calendarId,
        calendarTitle: calendar?.title ?? 'Phone calendar',
        calendarColor: calendar?.color ?? '#CFC6FF',
        title: event.title?.trim() || 'Untitled event',
        start: toIso(event.startDate),
        end: toIso(event.endDate),
        isAllDay: event.allDay,
        location: event.location ?? null,
        notes: event.notes ?? null,
        timeZone: event.timeZone ?? null,
        url: event.url ?? null,
        availability: event.availability ?? null,
        status: event.status ?? null,
        organizer: event.organizer?.name ?? null,
        organizerEmail: event.organizerEmail ?? null,
        recurrenceText: formatRecurrence(event.recurrenceRule),
        alarmsCount: event.alarms?.length ?? 0,
      };
    })
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());

  return {
    available: true,
    permission: 'granted',
    calendars: normalizedCalendars,
    events: normalizedEvents,
    syncedAt: new Date().toISOString(),
  };
}

export async function openDeviceCalendarEvent(eventId: string, instanceStartDate?: string) {
  const available = await isDeviceCalendarAvailable();
  if (!available) {
    return;
  }

  await Calendar.openEventInCalendarAsync({
    id: eventId,
    instanceStartDate,
  });
}

export async function isDeviceCalendarAvailable() {
  if (Platform.OS === 'web') {
    return false;
  }
  return Calendar.isAvailableAsync();
}

export async function ensureDeviceCalendarPermission(): Promise<DeviceCalendarPermission> {
  const existing = await Calendar.getCalendarPermissionsAsync();
  if (existing.status === 'granted') {
    return 'granted';
  }
  const requested = await Calendar.requestCalendarPermissionsAsync();
  return requested.status === 'granted' ? 'granted' : 'denied';
}

function toIso(value: string | Date) {
  return typeof value === 'string' ? new Date(value).toISOString() : value.toISOString();
}

function formatRecurrence(
  recurrenceRule: Calendar.RecurrenceRule | null | undefined,
) {
  if (!recurrenceRule) {
    return null;
  }
  const frequency = recurrenceRule.frequency
    ? recurrenceRule.frequency.charAt(0).toUpperCase() + recurrenceRule.frequency.slice(1)
    : 'Repeats';
  const interval = recurrenceRule.interval && recurrenceRule.interval > 1 ? ` every ${recurrenceRule.interval}` : '';
  return `${frequency}${interval}`;
}
