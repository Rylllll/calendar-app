import { Coordinates } from '@/types/domain';

export function buildMapsSearchUrl(label: string, coordinates?: Coordinates) {
  const query = coordinates
    ? `${coordinates.latitude},${coordinates.longitude} (${label})`
    : label;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function buildMapsDirectionsUrl(
  destination: Coordinates,
  destinationLabel: string,
  origin?: Coordinates,
) {
  const params = [
    'api=1',
    `destination=${encodeURIComponent(
      `${destination.latitude},${destination.longitude} (${destinationLabel})`,
    )}`,
    'travelmode=driving',
  ];

  if (origin) {
    params.push(
      `origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}`,
    );
  }

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

export function buildBookingSearchUrl(query: string) {
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}`;
}

export function buildFlightSearchUrl(originLabel: string, destinationLabel: string) {
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `${originLabel} to ${destinationLabel}`,
  )}`;
}
