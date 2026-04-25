import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createInitialPlannerData } from '@/data/initial-planner-data';
import plannerStorage from '@/services/storage';
import { sanitizeTrips } from '@/services/trip-sanitizer-service';
import { PlannerState } from '@/types/domain';
import {
  calculateRewardProgress,
  getUnlockedThemeThreshold,
} from '@/services/travel-heuristics';

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      ...createInitialPlannerData(),
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
      setSelectedDate: (value) => set({ selectedDate: value }),
      setActiveTripId: (tripId) =>
        set((state) => ({
          activeTripId: tripId,
          trips: state.trips.map((trip) => ({
            ...trip,
            active: trip.id === tripId,
          })),
        })),
      toggleTripMode: () => set((state) => ({ tripModeEnabled: !state.tripModeEnabled })),
      setThemePreference: (value) => set({ themePreference: value }),
      setAccentTheme: (value) => {
        const unlocked = get().unlockedThemes.includes(value);
        if (unlocked) {
          set({ activeAccentTheme: value });
        }
      },
      toggleChecklistTask: (tripId, taskId) =>
        set((state) => {
          const trips = state.trips.map((trip) => {
            if (trip.id !== tripId) {
              return trip;
            }
            const checklist = trip.checklist.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task,
            );
            return { ...trip, checklist };
          });
          const activeTrip = trips.find((trip) => trip.id === tripId);
          const rewardPoints = activeTrip
            ? calculateRewardProgress(activeTrip.checklist, state.streak)
            : state.rewardPoints;
          const unlockedThemes = [...state.unlockedThemes];
          if (
            rewardPoints >= getUnlockedThemeThreshold('citrus') &&
            !unlockedThemes.includes('citrus')
          ) {
            unlockedThemes.push('citrus');
          }
          return { trips, rewardPoints, unlockedThemes };
        }),
      updateCheckInField: (tripId, field, value) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId ? { ...trip, checkIn: { ...trip.checkIn, [field]: value } } : trip,
          ),
        })),
      addBudgetEntry: (entry) =>
        set((state) => ({
          budgetEntries: [entry, ...state.budgetEntries],
        })),
      replaceBudgetEntriesForTrip: (tripId, entries) =>
        set((state) => ({
          budgetEntries: [
            ...entries,
            ...state.budgetEntries.filter((entry) => entry.tripId !== tripId),
          ],
        })),
      setParticipantsReadiness: (tripId, participantId, readiness) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  participants: trip.participants.map((participant) =>
                    participant.id === participantId ? { ...participant, readiness } : participant,
                  ),
                }
              : trip,
          ),
        })),
      refreshBookingAlerts: (alerts) => set({ bookingAlerts: alerts }),
      updateWeatherSnapshot: (tripId, snapshot) =>
        set((state) => ({
          trips: state.trips.map((trip) => (trip.id === tripId ? { ...trip, weather: snapshot } : trip)),
          weatherCache: {
            ...state.weatherCache,
            [`${tripId}`]: snapshot,
          },
        })),
      setDeviceCalendarPermission: (value) => set({ deviceCalendarPermission: value }),
      syncDeviceCalendarData: (calendars, events, syncedAt) =>
        set({
          deviceCalendarPermission: 'granted',
          deviceCalendars: calendars,
          deviceCalendarEvents: events,
          deviceCalendarLastSyncedAt: syncedAt,
        }),
      clearDeviceCalendarSync: () =>
        set({
          deviceCalendars: [],
          deviceCalendarEvents: [],
          deviceCalendarLastSyncedAt: null,
        }),
      setDeviceLocation: (permission, snapshot) =>
        set({
          deviceLocationPermission: permission,
          deviceLocation: snapshot,
        }),
      saveTrip: (trip) =>
        set((state) => {
          const existing = state.trips.find((item) => item.id === trip.id);
          const trips = existing
            ? state.trips.map((item) =>
                item.id === trip.id
                  ? { ...trip, active: true }
                  : { ...item, active: false },
              )
            : [{ ...trip, active: true }, ...state.trips.map((item) => ({ ...item, active: false }))];
          return {
            trips,
            activeTripId: trip.id,
            tripModeEnabled: true,
          };
        }),
    }),
    {
      name: 'planner-storage-v1',
      version: 4,
      storage: createJSONStorage(() => plannerStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      migrate: (persistedState: unknown, version) => {
        const state = persistedState as Partial<PlannerState> | undefined;
        if (!state) {
          return createInitialPlannerData();
        }

        if (version < 2) {
          return {
            ...state,
            activeTripId: null,
            tripModeEnabled: false,
            events: [],
            trips: [],
            budgetEntries: [],
            bookingAlerts: [],
            rewardPoints: 0,
            streak: 0,
            unlockedThemes: ['aurora'],
            deviceLocationPermission: 'unknown',
            deviceLocation: null,
          };
        }

        if (version < 3) {
          return {
            ...state,
            activeTripId: null,
            tripModeEnabled: false,
            trips: [],
            budgetEntries: [],
          };
        }

        if (version < 4) {
          return {
            ...state,
            trips: sanitizeTrips(state.trips ?? []),
          };
        }

        return state;
      },
      partialize: (state) => ({
        selectedDate: state.selectedDate,
        tripModeEnabled: state.tripModeEnabled,
        activeTripId: state.activeTripId,
        themePreference: state.themePreference,
        activeAccentTheme: state.activeAccentTheme,
        unlockedThemes: state.unlockedThemes,
        streak: state.streak,
        rewardPoints: state.rewardPoints,
        events: state.events,
        trips: state.trips,
        budgetEntries: state.budgetEntries,
        bookingAlerts: state.bookingAlerts,
        weatherCache: state.weatherCache,
        deviceCalendarPermission: state.deviceCalendarPermission,
        deviceCalendars: state.deviceCalendars,
        deviceCalendarEvents: state.deviceCalendarEvents,
        deviceCalendarLastSyncedAt: state.deviceCalendarLastSyncedAt,
        deviceLocationPermission: state.deviceLocationPermission,
        deviceLocation: state.deviceLocation,
      }),
    },
  ),
);
