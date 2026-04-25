import { ItinerarySuggestion, TransportConnection, TransportHub, Trip } from '@/types/domain';

const syntheticSuggestionSuffixes = [
  'central stay',
  'main transit hub',
  'coffee stop',
  'local kitchen',
  'highlight',
];

export function sanitizeTrips(trips: Trip[]) {
  return trips.map(sanitizeTrip);
}

export function sanitizeTrip(trip: Trip): Trip {
  const suggestions = trip.suggestions.filter((suggestion) =>
    isRealSuggestion(suggestion, trip.destination.name),
  );
  const transportHubs = trip.transportHubs.filter(isLikelyRealTransportHub);
  const validHubIds = new Set(transportHubs.map((hub) => hub.id));
  const transportConnections = trip.transportConnections.filter((connection) =>
    isLikelyRealTransportConnection(connection, validHubIds),
  );

  return {
    ...trip,
    suggestions,
    transportHubs,
    transportConnections,
  };
}

function isRealSuggestion(suggestion: ItinerarySuggestion, destinationName: string) {
  const normalizedTitle = suggestion.title.trim().toLowerCase();
  const normalizedDestination = destinationName.trim().toLowerCase();

  if (suggestion.id.startsWith('fallback-')) {
    return false;
  }

  return !syntheticSuggestionSuffixes.some(
    (suffix) => normalizedTitle === `${normalizedDestination} ${suffix}`,
  );
}

function isLikelyRealTransportHub(hub: TransportHub) {
  const normalizedName = hub.name.toLowerCase();

  if (
    normalizedName.includes('heliport') ||
    normalizedName.includes('helipad') ||
    normalizedName.includes('air base')
  ) {
    return false;
  }

  if (hub.type === 'airport') {
    return Boolean(hub.code || normalizedName.includes('airport'));
  }

  return (
    normalizedName.includes('bus') ||
    normalizedName.includes('terminal') ||
    normalizedName.includes('station')
  );
}

function isLikelyRealTransportConnection(
  connection: TransportConnection,
  validHubIds: Set<string>,
) {
  return (
    validHubIds.has(connection.originHub.id) &&
    validHubIds.has(connection.destinationHub.id)
  );
}
