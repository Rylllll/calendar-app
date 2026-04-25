import { useMemo } from 'react';

import { usePlanner } from '@/hooks/use-planner';
import {
  buildLocalReminders,
  buildMemoryPrompts,
  buildOfflineSupportItems,
  buildOptimizationInsights,
  buildSmartScheduleBlocks,
  calculateBudgetPulse,
} from '@/services/trip-intelligence-service';
import {
  buildMicroLogistics,
  buildPredictiveBlocks,
  getReadinessScore,
  getTransportSuggestion,
} from '@/services/travel-heuristics';

export function useTrip() {
  const planner = usePlanner();

  const predictiveBlocks = useMemo(
    () =>
      buildPredictiveBlocks(
        planner.events,
        planner.activeTrip,
        planner.activeTrip?.homeBase,
      ),
    [planner.activeTrip, planner.events],
  );

  const microLogistics = useMemo(
    () => (planner.activeTrip ? buildMicroLogistics(planner.activeTrip, planner.events) : []),
    [planner.activeTrip, planner.events],
  );

  const readiness = useMemo(
    () =>
      planner.activeTrip
        ? getReadinessScore(planner.activeTrip.checklist, planner.activeTrip.participants)
        : 0,
    [planner.activeTrip],
  );

  const smartScheduleBlocks = useMemo(
    () => buildSmartScheduleBlocks(planner.activeTrip, planner.activeTrip?.weather),
    [planner.activeTrip],
  );

  const optimizationInsights = useMemo(
    () => buildOptimizationInsights(planner.activeTrip, planner.activeTrip?.weather),
    [planner.activeTrip],
  );

  const reminders = useMemo(
    () => buildLocalReminders(planner.activeTrip),
    [planner.activeTrip],
  );

  const offlineSupportItems = useMemo(
    () => buildOfflineSupportItems(planner.activeTrip),
    [planner.activeTrip],
  );

  const memoryPrompts = useMemo(
    () => buildMemoryPrompts(planner.activeTrip),
    [planner.activeTrip],
  );

  const budgetPulse = useMemo(
    () => calculateBudgetPulse(planner.budgetEntries, planner.activeTrip),
    [planner.activeTrip, planner.budgetEntries],
  );

  return {
    ...planner,
    predictiveBlocks,
    microLogistics,
    readiness,
    smartScheduleBlocks,
    optimizationInsights,
    reminders,
    offlineSupportItems,
    memoryPrompts,
    budgetPulse,
    transportSuggestion: planner.activeTrip
      ? getTransportSuggestion(planner.activeTrip.groupSize)
      : 'No active trip',
  };
}
