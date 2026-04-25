import { addDays, nextSaturday, startOfDay } from 'date-fns';

import { matchBookingAvailability } from '@/services/travel-heuristics';
import { buildMapsSearchUrl } from '@/services/maps-service';
import {
  PlanTripInput,
  PlannedTripPayload,
  planTripWithAssistant,
} from '@/services/trip-planner-service';
import {
  BudgetEntry,
  DeviceLocationSnapshot,
  ItinerarySuggestion,
  TransportConnection,
  Trip,
} from '@/types/domain';

export async function checkBookingAvailability(preference: Trip['bookingPreference']) {
  await new Promise((resolve) => setTimeout(resolve, 850));
  return matchBookingAvailability(preference);
}

export interface BookingDraft {
  id: string;
  prompt: string;
  trip: Trip;
  budgetEntries: BudgetEntry[];
  selectedConnection?: TransportConnection;
  selectedStay?: ItinerarySuggestion;
  providerLabel: string;
  providerActionUrl: string;
  totalEstimatedPrice: number;
  confirmationHint: string;
}

export async function buildBookingDraft(
  prompt: string,
  origin: DeviceLocationSnapshot | null,
  activeTrip?: Trip | null,
): Promise<BookingDraft> {
  const tripInput = parsePromptToTripInput(prompt, origin, activeTrip);
  const planned = await planTripWithAssistant(tripInput);
  const selectedConnection = chooseBestConnection(planned.trip.transportConnections, prompt);
  const selectedStay =
    planned.trip.suggestions.find((suggestion) => suggestion.category === 'stay');
  const stayCost = selectedStay ? estimateStayTotal(selectedStay, planned.trip) : 0;
  const totalEstimatedPrice = (selectedConnection?.estimatedPrice ?? 0) + stayCost;

  return {
    id: `draft-${planned.trip.id}`,
    prompt,
    trip: planned.trip,
    budgetEntries: planned.budgetEntries,
    selectedConnection,
    selectedStay,
    providerLabel: resolveProviderLabel(selectedConnection, selectedStay),
    providerActionUrl:
      selectedConnection?.bookingUrl ??
      selectedStay?.bookingUrl ??
      planned.trip.bookingPreference.bookingUrl,
    totalEstimatedPrice,
    confirmationHint:
      'Confirmation saves the booking locally in the app. Payment and final completion still happen with the provider you open next.',
  };
}

export function confirmBookingDraft(draft: BookingDraft): PlannedTripPayload {
  const confirmedTrip: Trip = {
    ...draft.trip,
    confirmedBooking: {
      id: `confirmed-${draft.trip.id}`,
      tripId: draft.trip.id,
      kind: draft.selectedConnection?.mode ?? 'stay',
      provider: draft.providerLabel,
      reference: buildBookingReference(draft.trip.destination.name),
      summary: draft.selectedConnection
        ? `${draft.selectedConnection.title} saved for ${draft.trip.destination.name}`
        : `Stay option saved for ${draft.trip.destination.name}`,
      status: 'confirmed',
      totalAmount:
        draft.totalEstimatedPrice > 0
          ? draft.totalEstimatedPrice
          : draft.trip.bookingPreference.budgetCeiling,
      currencyCode: draft.trip.currencyCode,
      confirmedAt: new Date().toISOString(),
      bookingUrl: draft.providerActionUrl,
      mapsUrl:
        draft.selectedConnection?.mapsUrl ??
        buildMapsSearchUrl(draft.trip.destination.name, draft.trip.destination),
      routeLabel: draft.selectedConnection?.title,
      stayLabel: draft.selectedStay?.title,
    },
  };

  return {
    trip: confirmedTrip,
    budgetEntries: draft.budgetEntries,
  };
}

function parsePromptToTripInput(
  prompt: string,
  origin: DeviceLocationSnapshot | null,
  activeTrip?: Trip | null,
): PlanTripInput {
  const normalizedPrompt = prompt.trim();
  const destinationQuery =
    extractDestinationQuery(normalizedPrompt) ??
    activeTrip?.destination.name ??
    normalizedPrompt;
  const startDate = resolveStartDate(normalizedPrompt);
  const durationDays = resolveDurationDays(normalizedPrompt);
  const endDate = addDays(startDate, durationDays);

  return {
    destinationQuery,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    groupSize: resolveGroupSize(normalizedPrompt),
    budgetCeiling: resolveBudgetCeiling(normalizedPrompt),
    interests: resolveInterests(normalizedPrompt),
    request: normalizedPrompt,
    origin,
  };
}

function extractDestinationQuery(prompt: string) {
  const destinationPattern =
    /(?:to|visit|for)\s+([a-z][a-z\s.'-]+?)(?=\s+(?:for\s+\d+\s*(?:day|days|night|nights)|next|this|tomorrow|today|under|budget|with|for\s+\d+\s*(?:people|person|pax|traveler|travelers|traveller|travellers)|via)\b|[,.]|$)/i;
  const matchedDestination = prompt.match(destinationPattern)?.[1]?.trim();
  if (matchedDestination) {
    return titleCaseWords(matchedDestination);
  }

  const simplified = prompt.replace(
    /\b(book|me|a|an|trip|flight|bus|train|rail|hotel|stay|please|planner)\b/gi,
    '',
  );
  const fallback = simplified
    .replace(
      /\b(next week|this weekend|weekend|tomorrow|today|under.+$|budget.+$|with.+$)\b/gi,
      '',
    )
    .trim();

  return fallback ? titleCaseWords(fallback) : null;
}

function resolveStartDate(prompt: string) {
  const today = startOfDay(new Date());
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('today')) {
    return today;
  }
  if (lowerPrompt.includes('tomorrow')) {
    return addDays(today, 1);
  }
  if (lowerPrompt.includes('weekend')) {
    return startOfDay(nextSaturday(today));
  }
  if (lowerPrompt.includes('next week')) {
    return addDays(today, 7);
  }

  return addDays(today, 14);
}

function resolveDurationDays(prompt: string) {
  const match = prompt.match(/(\d+)\s*[- ]?\s*(day|days|night|nights)/i);
  if (match) {
    return Math.max(1, Number(match[1]));
  }

  return prompt.toLowerCase().includes('weekend') ? 2 : 3;
}

function resolveGroupSize(prompt: string) {
  const explicitMatch = prompt.match(
    /(\d+)\s*(people|person|pax|traveler|travelers|traveller|travellers|guest|guests)/i,
  );
  if (explicitMatch) {
    return Math.max(1, Number(explicitMatch[1]));
  }

  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('couple')) {
    return 2;
  }
  if (lowerPrompt.includes('family')) {
    return 4;
  }
  if (lowerPrompt.includes('group')) {
    return 5;
  }

  return 1;
}

function resolveBudgetCeiling(prompt: string) {
  const budgetMatch = prompt.match(
    /(?:under|budget|below)\s*(?:php|usd|sgd|eur|gbp|aud|cad|jpy|twd|thb|myr|idr|vnd|\$)?\s*([\d,]+)/i,
  );
  if (budgetMatch) {
    return Math.max(200, Number(budgetMatch[1].replace(/,/g, '')));
  }

  return 1800;
}

function resolveInterests(prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const interests = new Set<string>();

  if (/(food|restaurant|eat|dinner|lunch)/.test(lowerPrompt)) {
    interests.add('food');
  }
  if (/(coffee|cafe)/.test(lowerPrompt)) {
    interests.add('coffee');
  }
  if (/(museum|gallery|history|culture|temple|church)/.test(lowerPrompt)) {
    interests.add('culture');
  }
  if (/(beach|nature|island|park|hike|mountain)/.test(lowerPrompt)) {
    interests.add('nature');
  }
  if (/(easy|relax|simple|light)/.test(lowerPrompt)) {
    interests.add('easy');
  }

  return interests.size ? [...interests] : ['culture', 'food'];
}

function chooseBestConnection(connections: TransportConnection[], prompt: string) {
  if (!connections.length) {
    return undefined;
  }

  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('bus')) {
    return connections.find((connection) => connection.mode === 'bus') ?? connections[0];
  }
  if (lowerPrompt.includes('train') || lowerPrompt.includes('rail')) {
    return connections.find((connection) => connection.mode === 'rail') ?? connections[0];
  }
  if (lowerPrompt.includes('flight') || lowerPrompt.includes('plane')) {
    return connections.find((connection) => connection.mode === 'flight') ?? connections[0];
  }

  return (
    connections.find((connection) => connection.mode === 'flight') ??
    connections.find((connection) => connection.mode === 'rail') ??
    connections[0]
  );
}

function estimateStayTotal(stay: ItinerarySuggestion, trip: Trip) {
  const tripDays = Math.max(
    1,
    Math.round(
      (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  if (stay.priceUnit === 'per_night') {
    return stay.estimatedPrice * tripDays;
  }
  if (stay.priceUnit === 'per_person') {
    return stay.estimatedPrice * trip.groupSize;
  }

  return stay.estimatedPrice;
}

function resolveProviderLabel(
  connection?: TransportConnection,
  stay?: ItinerarySuggestion,
) {
  if (connection?.mode === 'flight') {
    return 'Google Flights';
  }
  if (connection?.mode === 'bus' || connection?.mode === 'rail') {
    return 'Google Maps Transit';
  }
  if (stay) {
    return 'Booking.com';
  }

  return 'Provider search';
}

function buildBookingReference(destinationName: string) {
  const slug = destinationName.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'TRIP';
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug}-${random}`;
}

function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}
