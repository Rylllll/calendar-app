import {
  addHours,
  addMinutes,
  differenceInCalendarDays,
  format,
  isWeekend,
  parseISO,
  set,
  startOfDay,
  subDays,
} from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  BudgetEntry,
  PlannerEvent,
  Place,
  Trip,
  WeatherSnapshot,
} from '@/types/domain';

export interface GuidanceItem {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  detail: string;
}

export interface BudgetPulse {
  allocatedPerDay: number;
  spent: number;
  remaining: number;
  ratio: number;
  note: string;
}

export function buildSmartScheduleBlocks(
  trip: Trip | undefined,
  weather?: WeatherSnapshot,
): PlannerEvent[] {
  if (!trip) {
    return [];
  }

  const tripStart = startOfDay(parseISO(trip.startDate));
  const coffeeSpot = pickSuggestionPlace(trip, 'coffee', trip.homeBase);
  const lunchSpot = pickSuggestionPlace(trip, 'food', trip.destination);
  const exploreSpot = pickSecondHalfPlace(trip);
  const dinnerSpot = pickSuggestionPlace(trip, 'food', exploreSpot);
  const firstStop = trip.itinerary[0];
  const breakfastTime = firstStop
    ? addMinutes(parseISO(firstStop.time), -90)
    : set(tripStart, { hours: 8, minutes: 0, seconds: 0, milliseconds: 0 });
  const lunchTime = set(tripStart, { hours: 12, minutes: 30, seconds: 0, milliseconds: 0 });
  const exploreTime = set(
    tripStart,
    weather && isWetWeather(weather) ? { hours: 10, minutes: 45 } : { hours: 16, minutes: 0 },
  );
  const dinnerTime = set(tripStart, { hours: 19, minutes: 0, seconds: 0, milliseconds: 0 });
  const itineraryBlocks = trip.itinerary.map<PlannerEvent>((stop, index) => ({
    id: `smart-itinerary-${trip.id}-${stop.id}`,
    title: stop.title,
    start: stop.time,
    end: addMinutes(parseISO(stop.time), stop.mode === 'walk' ? 60 : 75).toISOString(),
    category: stop.mode === 'walk' ? 'focus' : 'travel',
    priority: index === 0 ? 'high' : 'medium',
    tags: ['smart-plan', stop.mode],
    relatedTripId: trip.id,
    location: stop.place,
    description: stop.subtitle,
    hiddenInTripMode: false,
  }));

  const dayBlocks: PlannerEvent[] = [
    {
      id: `smart-breakfast-${trip.id}`,
      title: 'Breakfast reset',
      start: breakfastTime.toISOString(),
      end: addMinutes(breakfastTime, 45).toISOString(),
      category: 'wellness',
      priority: 'medium',
      tags: ['smart-plan', 'meal'],
      relatedTripId: trip.id,
      location: coffeeSpot,
      description: 'Start close to the first stop to protect travel slack.',
      hiddenInTripMode: false,
    },
    ...itineraryBlocks,
    {
      id: `smart-lunch-${trip.id}`,
      title: 'Lunch window',
      start: lunchTime.toISOString(),
      end: addMinutes(lunchTime, 60).toISOString(),
      category: 'wellness',
      priority: 'medium',
      tags: ['smart-plan', 'meal'],
      relatedTripId: trip.id,
      location: lunchSpot,
      description: 'Auto-slotted between the daytime route and late afternoon movement.',
      hiddenInTripMode: false,
    },
    {
      id: `smart-explore-${trip.id}`,
      title: weather && isWetWeather(weather) ? 'Indoor flex block' : 'Golden hour flex block',
      start: exploreTime.toISOString(),
      end: addMinutes(exploreTime, 75).toISOString(),
      category: 'focus',
      priority: 'medium',
      tags: ['smart-plan', 'flex'],
      relatedTripId: trip.id,
      location: exploreSpot,
      description: weather && isWetWeather(weather)
        ? 'Weather-aware shift to a more comfortable indoor or covered block.'
        : 'Best used for shopping, photos, or a second attraction before dinner.',
      hiddenInTripMode: false,
    },
    {
      id: `smart-dinner-${trip.id}`,
      title: 'Dinner reservation window',
      start: dinnerTime.toISOString(),
      end: addMinutes(dinnerTime, 90).toISOString(),
      category: 'booking',
      priority: 'medium',
      tags: ['smart-plan', 'meal'],
      relatedTripId: trip.id,
      location: dinnerSpot,
      description: 'Held late enough to recover from transit but before night queues build.',
      hiddenInTripMode: false,
    },
  ];

  return dedupeSchedule(dayBlocks).sort(
    (left, right) => new Date(left.start).getTime() - new Date(right.start).getTime(),
  );
}

export function buildOptimizationInsights(
  trip: Trip | undefined,
  weather?: WeatherSnapshot,
): GuidanceItem[] {
  if (!trip) {
    return [];
  }

  const firstConnection = trip.transportConnections[0];
  const travelLeadHours = firstConnection?.mode === 'flight' ? 3 : 1.5;

  return [
    {
      id: 'time-window',
      icon: 'clock-time-four-outline',
      title: 'Best visiting window',
      detail: isWeekend(parseISO(trip.startDate))
        ? 'Front-load the first attraction before 10:30 AM to stay ahead of weekend crowd peaks.'
        : 'The calmest route is morning arrival, lunch by 12:30 PM, and the second activity after 4 PM.',
    },
    {
      id: 'weather-route',
      icon: weather && isWetWeather(weather) ? 'weather-rainy' : 'weather-partly-cloudy',
      title: 'Weather-aware route',
      detail: weather && isWetWeather(weather)
        ? `${weather.condition} is expected, so outdoor time is shifted earlier and the flex block becomes indoor-friendly.`
        : 'Current weather is favorable, so the planner keeps the long outdoor block later in the day.',
    },
    {
      id: 'transit-buffer',
      icon: firstConnection?.mode === 'flight' ? 'airplane-clock' : 'bus-clock',
      title: 'Transit buffer',
      detail: firstConnection
        ? `Leave ${travelLeadHours} hours before ${firstConnection.mode === 'flight' ? 'airport departure' : 'bus departure'} to absorb check-in and transfer time.`
        : 'No verified transport connection was found yet. Sync location and refine the destination spelling for better route matching.',
    },
    {
      id: 'group-logic',
      icon: 'account-group-outline',
      title: 'Group optimization',
      detail:
        trip.groupSize > 3
          ? 'Shared vehicle or shuttle first/last-mile legs will protect time better than fragmented arrivals.'
          : 'A compact party can keep walk + rail combinations without over-padding the day.',
    },
  ];
}

export function buildLocalReminders(trip: Trip | undefined): GuidanceItem[] {
  if (!trip) {
    return [];
  }

  const start = parseISO(trip.startDate);
  const firstConnection = trip.transportConnections[0];
  const firstItinerary = trip.itinerary[0];

  return [
    {
      id: 'passport',
      icon: 'passport',
      title: 'Passport and visa check',
      detail: `${format(subDays(start, 7), 'EEE, MMM d')} - verify passport validity, visa status, and reservation emails.`,
    },
    {
      id: 'hotel',
      icon: 'bed-outline',
      title: 'Hotel and check-in reconfirm',
      detail: `${format(start, 'EEE, MMM d')} morning - confirm the first stay, arrival notes, and local address offline.`,
    },
    {
      id: 'terminal',
      icon: firstConnection?.mode === 'flight' ? 'airplane-takeoff' : 'bus-alert',
      title: 'Departure reminder',
      detail: firstConnection && firstItinerary
        ? `${format(addHours(parseISO(firstItinerary.time), firstConnection.mode === 'flight' ? -3 : -1), 'h:mm a')} - leave for ${firstConnection.originHub.name}.`
        : 'Set the final departure reminder after transport is confirmed.',
    },
    {
      id: 'sim',
      icon: 'sim',
      title: 'SIM / eSIM activation',
      detail: `${format(start, 'EEE, MMM d')} after arrival - enable roaming backup or activate local data before navigation starts.`,
    },
  ];
}

export function buildOfflineSupportItems(trip: Trip | undefined): GuidanceItem[] {
  if (!trip) {
    return [];
  }

  return [
    {
      id: 'maps',
      icon: 'map-outline',
      title: 'Offline route pack',
      detail: `Save ${trip.destination.name} maps, the hotel address, and the first transfer route before departure.`,
    },
    {
      id: 'tickets',
      icon: 'ticket-confirmation-outline',
      title: 'Ticket backup',
      detail: trip.qrPasses.length
        ? `${trip.qrPasses.length} passes are already stored locally. Add any missing boarding or event codes before the trip starts.`
        : 'No offline passes are saved yet. Add ticket screenshots or QR payloads for backup access.',
    },
    {
      id: 'contacts',
      icon: 'card-account-phone-outline',
      title: 'Emergency contacts',
      detail: 'Keep hotel contact details, embassy info, and one shared group contact pinned for offline access.',
    },
  ];
}

export function buildMemoryPrompts(trip: Trip | undefined): GuidanceItem[] {
  if (!trip) {
    return [];
  }

  const firstStop = trip.itinerary[0];
  const lastStop = trip.itinerary[trip.itinerary.length - 1];

  return [
    {
      id: 'memory-start',
      icon: 'image-outline',
      title: 'Arrival memory',
      detail: firstStop
        ? `Capture one opening photo at ${firstStop.place.name} and add a two-line note while the day is still fresh.`
        : 'Save one arrival photo and a short first impression to start the trip timeline.',
    },
    {
      id: 'memory-highlight',
      icon: 'notebook-outline',
      title: 'Daily highlight',
      detail: 'At the end of the day, mark one place worth revisiting and one budget decision that was worth it.',
    },
    {
      id: 'memory-close',
      icon: 'map-marker-check-outline',
      title: 'Trip close-out',
      detail: lastStop
        ? `Use ${lastStop.place.name} as the closing memory anchor so the app can group photos and notes around the last stop.`
        : 'Finish the timeline with one summary entry before the trip fades into regular calendar noise.',
    },
  ];
}

export function calculateBudgetPulse(
  entries: BudgetEntry[],
  trip: Trip | undefined,
): BudgetPulse | null {
  if (!trip) {
    return null;
  }

  const tripDays = Math.max(
    1,
    differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) || 1,
  );
  const allocatedPerDay = Math.round(trip.bookingPreference.budgetCeiling / tripDays);
  const spent = entries.reduce(
    (sum, entry) => sum + (entry.perPerson ? entry.amount * trip.groupSize : entry.amount),
    0,
  );
  const remaining = trip.bookingPreference.budgetCeiling - spent;
  const ratio = spent / Math.max(trip.bookingPreference.budgetCeiling, 1);

  return {
    allocatedPerDay,
    spent,
    remaining,
    ratio,
    note:
      ratio >= 0.85
        ? 'You already crossed 85% of the trip budget. Hold optional bookings until essentials are locked.'
        : ratio >= 0.6
          ? 'Spending is healthy, but the next big booking should stay inside the daily cap.'
          : 'Budget is still flexible. The current route leaves room for one premium booking choice.',
  };
}

function pickSuggestionPlace(trip: Trip, category: Trip['suggestions'][number]['category'], fallback: Place) {
  const match = trip.suggestions.find((suggestion) => suggestion.category === category);
  return match
    ? {
        id: match.id,
        name: match.title,
        subtitle: match.subtitle,
        latitude: match.latitude,
        longitude: match.longitude,
      }
    : fallback;
}

function pickSecondHalfPlace(trip: Trip) {
  const secondSight = trip.suggestions.filter((suggestion) => suggestion.category === 'sights')[1];
  return secondSight
    ? {
        id: secondSight.id,
        name: secondSight.title,
        subtitle: secondSight.subtitle,
        latitude: secondSight.latitude,
        longitude: secondSight.longitude,
      }
    : pickSuggestionPlace(trip, 'sights', trip.destination);
}

function dedupeSchedule(events: PlannerEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.title}:${event.start}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isWetWeather(weather: WeatherSnapshot) {
  return ['Rain', 'Heavy rain', 'Storm'].includes(weather.condition);
}
