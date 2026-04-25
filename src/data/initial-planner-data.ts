import { PlannerData } from '@/types/domain';
import { startOfTodayIso } from '@/utils/date';

export function createInitialPlannerData(): PlannerData {
  return {
    selectedDate: startOfTodayIso(),
    tripModeEnabled: false,
    activeTripId: null,
    themePreference: 'system',
    activeAccentTheme: 'aurora',
    unlockedThemes: ['aurora'],
    streak: 0,
    rewardPoints: 0,
    events: [],
    trips: [],
    budgetEntries: [],
    bookingAlerts: [],
    weatherCache: {},
    deviceCalendarPermission: 'unknown',
    deviceCalendars: [],
    deviceCalendarEvents: [],
    deviceCalendarLastSyncedAt: null,
    deviceLocationPermission: 'unknown',
    deviceLocation: null,
  };
}
