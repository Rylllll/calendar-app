import { addMinutes, differenceInMinutes, parseISO, subMinutes } from 'date-fns';

import {
  BookingAlert,
  BudgetEntry,
  ChecklistTask,
  ItineraryStop,
  Participant,
  PlannerEvent,
  Place,
  Trip,
} from '@/types/domain';
import { round, haversineKm, clamp } from '@/utils/math';

export interface DerivedBlock extends PlannerEvent {
  derived: true;
}

export function getReadinessScore(tasks: ChecklistTask[], participants: Participant[]) {
  const taskScore =
    tasks.length === 0 ? 0 : tasks.filter((task) => task.completed).length / tasks.length;
  const participantScore =
    participants.length === 0
      ? 0
      : participants.reduce((sum, participant) => sum + participant.readiness, 0) /
        participants.length /
        100;
  return Math.round((taskScore * 0.56 + participantScore * 0.44) * 100);
}

export function calculateRewardProgress(tasks: ChecklistTask[], streak: number) {
  const completedPoints = tasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.points, 0);
  return completedPoints + streak * 20;
}

export function getUnlockedThemeThreshold(theme: 'midnight' | 'citrus') {
  return theme === 'midnight' ? 180 : 420;
}

export function buildPredictiveBlocks(
  events: PlannerEvent[],
  trip: Trip | undefined,
  origin?: Place,
): DerivedBlock[] {
  if (!trip) {
    return [];
  }

  const departureEvent =
    trip.itinerary[0] ??
    events
      .filter((event) => event.relatedTripId === trip.id)
      .sort((left, right) => parseISO(left.start).getTime() - parseISO(right.start).getTime())[0];
  const stayStop = trip.itinerary.find((stop) =>
    stop.title.toLowerCase().includes('check in'),
  );
  const derived: DerivedBlock[] = [];

  if (departureEvent && origin) {
    const destination = getDeparturePlace(departureEvent, trip.destination);
    const departureTime = getDepartureTime(departureEvent);
    const travelMinutes = estimateTravelMinutes(origin, destination, trip.groupSize);
    derived.push({
      id: `derived-transfer-${trip.id}`,
      title: 'Route buffer',
      start: subMinutes(parseISO(departureTime), travelMinutes + 50).toISOString(),
      end: subMinutes(parseISO(departureTime), 50).toISOString(),
      category: 'travel',
      priority: 'high',
      tags: ['buffer', 'route'],
      relatedTripId: trip.id,
      transportMode: trip.groupSize > 2 ? 'shuttle' : 'ride',
      hiddenInTripMode: false,
      derived: true,
      location: destination,
      description: `${travelMinutes} min transit with traffic padding`,
    });
  }

  if (departureEvent) {
    const departureTime = getDepartureTime(departureEvent);
    const packingMinutes = trip.checklist.filter((task) => !task.completed && task.essential).length * 18 + 30;
    derived.push({
      id: `derived-packing-${trip.id}`,
      title: 'Packing sprint',
      start: subMinutes(parseISO(departureTime), packingMinutes + 140).toISOString(),
      end: subMinutes(parseISO(departureTime), 140).toISOString(),
      category: 'prep',
      priority: 'high',
      tags: ['packing'],
      relatedTripId: trip.id,
      hiddenInTripMode: false,
      derived: true,
      description: `${packingMinutes} min auto-generated from incomplete essentials`,
    });
  }

  if (stayStop) {
    derived.push({
      id: `derived-waiting-${trip.id}`,
      title: 'Arrival decompression',
      start: subMinutes(parseISO(stayStop.time), 35).toISOString(),
      end: stayStop.time,
      category: 'wellness',
      priority: 'medium',
      tags: ['waiting', 'reset'],
      relatedTripId: trip.id,
      hiddenInTripMode: false,
      derived: true,
      description: 'Built-in reset time before check-in',
    });
  }

  return derived;
}

export function buildMicroLogistics(trip: Trip, events: PlannerEvent[]) {
  const departureEvent =
    trip.itinerary[0] ??
    events.find((event) => event.relatedTripId === trip.id && event.category === 'travel');
  if (!departureEvent) {
    return [];
  }

  const departure = parseISO(getDepartureTime(departureEvent));
  return [
    {
      label: 'Ride reminder',
      time: addMinutes(departure, -165).toISOString(),
      note: trip.groupSize > 2 ? 'Reserve airport shuttle' : 'Confirm ride-share pickup',
    },
    {
      label: 'Document sweep',
      time: addMinutes(departure, -130).toISOString(),
      note: 'Passport, QR passes, wallet, and roaming check',
    },
    {
      label: 'Snack + water stop',
      time: addMinutes(departure, -85).toISOString(),
      note: 'Add a comfort buffer for the full group',
    },
  ];
}

function getDepartureTime(item: ItineraryStop | PlannerEvent) {
  return 'time' in item ? item.time : item.start;
}

function getDeparturePlace(item: ItineraryStop | PlannerEvent, fallback: Place) {
  if ('place' in item) {
    return item.place;
  }

  return item.location ?? fallback;
}

export function estimateTravelMinutes(origin: Place, destination: Place, groupSize: number) {
  const distance = haversineKm(origin, destination);
  const baseMinutes = distance < 3 ? distance * 14 : distance * 2.8;
  const groupPenalty = groupSize > 4 ? 14 : groupSize > 2 ? 8 : 0;
  return Math.max(18, Math.round(baseMinutes + groupPenalty));
}

export function getTransportSuggestion(groupSize: number) {
  if (groupSize >= 5) {
    return 'Split shuttle or van transfer';
  }
  if (groupSize >= 3) {
    return 'Airport shuttle with luggage padding';
  }
  return 'Ride-share + light rail hybrid';
}

export function calculateBudgetInsights(entries: BudgetEntry[], trip: Trip | undefined) {
  const people = trip?.groupSize ?? 1;
  const target = trip?.bookingPreference.budgetCeiling ?? 1650;
  const total = entries.reduce(
    (sum, entry) => sum + (entry.perPerson ? entry.amount * people : entry.amount),
    0,
  );
  const remaining = target - total;
  const impact = entries.map((entry) => ({
    ...entry,
    actualAmount: entry.perPerson ? entry.amount * people : entry.amount,
  }));

  const suggestions =
    remaining < 0
      ? [
          'Switch one ride-share leg to rail + short taxi finish.',
          'Cap dinner spend for day one and protect activity budget.',
        ]
      : remaining < 220
        ? ['Keep the next booking under watch instead of instant purchase.']
        : ['Budget is healthy enough to hold one backup booking.'];

  return { total, remaining, target, impact, suggestions };
}

export function matchBookingAvailability(preferences: Trip['bookingPreference']): BookingAlert[] {
  const variance = preferences.partySize > 2 ? -12 : -6;
  const price = clamp(preferences.budgetCeiling + variance, 120, preferences.budgetCeiling);
  return [
    {
      id: `booking-${preferences.id}`,
      preferenceId: preferences.id,
      title: `${preferences.label} now available`,
      status: 'available',
      price,
      note: 'Auto-ranked against saved budget and party size',
      bookingUrl: preferences.bookingUrl,
      lastCheckedAt: new Date().toISOString(),
    },
  ];
}

export function buildTimelineProgress(stops: ItineraryStop[], selectedStopId: string) {
  const index = stops.findIndex((stop) => stop.id === selectedStopId);
  return clamp(index / Math.max(stops.length - 1, 1), 0, 1);
}

export function summarizeTripFlow(stops: ItineraryStop[]) {
  return stops.reduce((minutes, current, index) => {
    if (!stops[index + 1]) {
      return minutes;
    }
    return (
      minutes +
      Math.max(0, differenceInMinutes(parseISO(stops[index + 1].time), parseISO(current.time)))
    );
  }, 0);
}

export function getWeatherCacheKey(lat: number, lon: number) {
  return `${round(lat, 2)}:${round(lon, 2)}`;
}
