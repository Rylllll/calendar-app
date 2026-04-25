import {
  Place,
  TransportConnection,
  TransportHub,
  TransportHubType,
} from '@/types/domain';
import {
  buildFlightSearchUrl,
  buildMapsDirectionsUrl,
  buildMapsSearchUrl,
} from '@/services/maps-service';
import { clamp, haversineKm, round } from '@/utils/math';

interface OverpassResponse {
  elements: OverpassElement[];
}

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
}

export async function fetchTransportContext(
  origin: Place,
  destination: Place,
  currencyCode: string,
) {
  const [originHubs, destinationHubs] = await Promise.all([
    fetchNearbyHubs(origin, 'origin'),
    fetchNearbyHubs(destination, 'destination'),
  ]);

  const hubs = [...originHubs, ...destinationHubs];
  const connections = buildTransportConnections(origin, destination, hubs, currencyCode);

  return {
    hubs,
    connections,
  };
}

async function fetchNearbyHubs(
  place: Place,
  area: 'origin' | 'destination',
): Promise<TransportHub[]> {
  const [overpassAirports, overpassBusStations] = await Promise.all([
    fetchOverpassHubs(place, area, 'airport'),
    fetchOverpassHubs(place, area, 'bus_terminal'),
  ]);

  const airports =
    overpassAirports.length > 0
      ? overpassAirports
      : await fetchFallbackSearchHubs(place, area, 'airport');
  const busStations =
    overpassBusStations.length > 0
      ? overpassBusStations
      : await fetchFallbackSearchHubs(place, area, 'bus_terminal');

  const deduped = new Map<string, TransportHub>();
  [...airports, ...busStations].forEach((hub) => {
    const key = `${hub.type}:${hub.name.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, hub);
    }
  });

  return [...deduped.values()].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'airport' ? -1 : 1;
    }

    return extractDistanceKm(left.subtitle) - extractDistanceKm(right.subtitle);
  });
}

async function fetchOverpassHubs(
  place: Place,
  area: 'origin' | 'destination',
  type: TransportHubType,
) {
  const radius = type === 'airport' ? 120000 : 28000;
  const query =
    type === 'airport'
      ? [
          '[out:json][timeout:25];',
          '(',
          `nwr["aeroway"="aerodrome"]["iata"](around:${radius},${place.latitude},${place.longitude});`,
          `nwr["aeroway"="aerodrome"]["icao"](around:${radius},${place.latitude},${place.longitude});`,
          `nwr["aeroway"="aerodrome"]["aerodrome:type"~"international|public|regional"](around:${radius},${place.latitude},${place.longitude});`,
          ');',
          'out center 60;',
        ].join('')
      : [
          '[out:json][timeout:25];',
          '(',
          `nwr["amenity"="bus_station"](around:${radius},${place.latitude},${place.longitude});`,
          `nwr["highway"="bus_station"](around:${radius},${place.latitude},${place.longitude});`,
          ');',
          'out center 60;',
        ].join('');

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as OverpassResponse;

  return payload.elements
    .map((element) => mapToTransportHub(element, place, area, type))
    .filter((value): value is TransportHub => Boolean(value))
    .slice(0, 6);
}

async function fetchFallbackSearchHubs(
  place: Place,
  area: 'origin' | 'destination',
  type: TransportHubType,
) {
  const query = `${place.name} ${type === 'airport' ? 'airport' : 'bus terminal'} ${
    place.country ?? ''
  }`.trim();
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=jsonv2&limit=5&q=${encodeURIComponent(query)}` +
    (place.countryCode ? `&countrycodes=${place.countryCode.toLowerCase()}` : '');

  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'VoyagrPlanner/1.0 (calendar travel planner)',
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as NominatimPlace[];
  return payload
    .map((item) => mapSearchResultToHub(item, place, area, type))
    .filter((value): value is TransportHub => Boolean(value));
}

function mapToTransportHub(
  element: OverpassElement,
  anchor: Place,
  area: 'origin' | 'destination',
  expectedType: TransportHubType,
): TransportHub | null {
  const tags = element.tags;
  const coordinates = element.center
    ? { latitude: element.center.lat, longitude: element.center.lon }
    : element.lat && element.lon
      ? { latitude: element.lat, longitude: element.lon }
      : null;

  if (!tags || !coordinates || !tags.name) {
    return null;
  }

  const type = resolveHubType(tags);
  if (!type || type !== expectedType) {
    return null;
  }

  if (!isVerifiedHub(tags, type)) {
    return null;
  }

  const distanceKm = haversineKm(anchor, coordinates);
  if ((type === 'airport' && distanceKm > 140) || (type === 'bus_terminal' && distanceKm > 30)) {
    return null;
  }

  return {
    id: `hub-${area}-${type}-${element.id}`,
    name: tags.name.trim(),
    subtitle: buildHubSubtitle(type, distanceKm, anchor.name),
    type,
    area,
    mapsUrl: buildMapsSearchUrl(tags.name.trim(), coordinates),
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    code: tags.iata || tags.icao || tags.ref,
  };
}

function mapSearchResultToHub(
  item: NominatimPlace,
  anchor: Place,
  area: 'origin' | 'destination',
  expectedType: TransportHubType,
): TransportHub | null {
  const lowerDisplay = item.display_name.toLowerCase();
  const looksLikeAirport =
    lowerDisplay.includes('airport') || lowerDisplay.includes('international airport');
  const looksLikeBusTerminal =
    lowerDisplay.includes('bus station') ||
    lowerDisplay.includes('bus terminal') ||
    lowerDisplay.includes('transport terminal');

  if (
    (expectedType === 'airport' && !looksLikeAirport) ||
    (expectedType === 'bus_terminal' && !looksLikeBusTerminal)
  ) {
    return null;
  }

  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  const distanceKm = haversineKm(anchor, { latitude, longitude });
  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    (expectedType === 'airport' && distanceKm > 160) ||
    (expectedType === 'bus_terminal' && distanceKm > 35)
  ) {
    return null;
  }

  const label = item.name?.trim() || item.display_name.split(',')[0]?.trim();
  if (!label) {
    return null;
  }

  return {
    id: `search-${area}-${expectedType}-${item.place_id}`,
    name: label,
    subtitle: buildHubSubtitle(expectedType, distanceKm, anchor.name),
    type: expectedType,
    area,
    mapsUrl: buildMapsSearchUrl(label, { latitude, longitude }),
    latitude,
    longitude,
  };
}

function resolveHubType(tags: Record<string, string>): TransportHubType | null {
  if (tags.aeroway === 'aerodrome') {
    return 'airport';
  }

  if (tags.amenity === 'bus_station' || tags.highway === 'bus_station') {
    return 'bus_terminal';
  }

  return null;
}

function isVerifiedHub(tags: Record<string, string>, type: TransportHubType) {
  const name = tags.name?.toLowerCase() ?? '';
  const access = tags.access?.toLowerCase();
  const aerodromeType = tags['aerodrome:type']?.toLowerCase();

  if (access === 'private' || access === 'no' || tags.military === 'yes') {
    return false;
  }

  if (type === 'airport') {
    if (name.includes('air base') || name.includes('heliport') || name.includes('helipad')) {
      return false;
    }

    return Boolean(
      tags.iata ||
        tags.icao ||
        name.includes('airport') ||
        ['international', 'public', 'regional', 'civil'].includes(aerodromeType ?? ''),
    );
  }

  return name.includes('bus') || name.includes('terminal') || name.includes('station');
}

function buildTransportConnections(
  origin: Place,
  destination: Place,
  hubs: TransportHub[],
  currencyCode: string,
): TransportConnection[] {
  const originAirports = hubs.filter((hub) => hub.area === 'origin' && hub.type === 'airport');
  const destinationAirports = hubs.filter(
    (hub) => hub.area === 'destination' && hub.type === 'airport',
  );
  const originBusStations = hubs.filter(
    (hub) => hub.area === 'origin' && hub.type === 'bus_terminal',
  );
  const destinationBusStations = hubs.filter(
    (hub) => hub.area === 'destination' && hub.type === 'bus_terminal',
  );
  const distanceKm = haversineKm(origin, destination);

  const flightOptions = originAirports.flatMap((originHub) =>
    destinationAirports.map((destinationHub, index) =>
      createFlightConnection(originHub, destinationHub, distanceKm, currencyCode, index),
    ),
  );

  const busOptions =
    distanceKm <= 620
      ? originBusStations.flatMap((originHub) =>
          destinationBusStations.map((destinationHub, index) =>
            createBusConnection(originHub, destinationHub, distanceKm, currencyCode, index),
          ),
        )
      : [];

  return [...flightOptions, ...busOptions]
    .sort((left, right) => left.estimatedPrice - right.estimatedPrice)
    .slice(0, 8);
}

function createFlightConnection(
  originHub: TransportHub,
  destinationHub: TransportHub,
  distanceKm: number,
  currencyCode: string,
  index: number,
): TransportConnection {
  const basePrice = clamp(Math.round(distanceKm * 0.12 + 78 + index * 18), 85, 1400);
  const durationMinutes = Math.round((distanceKm / 720) * 60 + 95 + index * 12);

  return {
    id: `flight-${originHub.id}-${destinationHub.id}`,
    mode: 'flight',
    title: `${formatHubName(originHub)} to ${formatHubName(destinationHub)}`,
    subtitle: 'Verified airport connection near your origin and destination',
    estimatedPrice: adjustPriceForCurrency(basePrice, currencyCode),
    durationMinutes,
    originHub,
    destinationHub,
    mapsUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub),
    bookingUrl: buildFlightSearchUrl(originHub.name, destinationHub.name),
  };
}

function createBusConnection(
  originHub: TransportHub,
  destinationHub: TransportHub,
  distanceKm: number,
  currencyCode: string,
  index: number,
): TransportConnection {
  const basePrice = clamp(Math.round(distanceKm * 0.03 + 8 + index * 5), 10, 260);
  const durationMinutes = Math.round((distanceKm / 55) * 60 + 25 + index * 10);

  return {
    id: `bus-${originHub.id}-${destinationHub.id}`,
    mode: 'bus',
    title: `${formatHubName(originHub)} to ${formatHubName(destinationHub)}`,
    subtitle: 'Verified bus-terminal route for this trip range',
    estimatedPrice: adjustPriceForCurrency(basePrice, currencyCode),
    durationMinutes,
    originHub,
    destinationHub,
    mapsUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub),
    bookingUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub),
  };
}

function formatHubName(hub: TransportHub) {
  return hub.code ? `${hub.name} (${hub.code})` : hub.name;
}

function buildHubSubtitle(type: TransportHubType, distanceKm: number, anchorName: string) {
  return type === 'airport'
    ? `${round(distanceKm, 1)} km from ${anchorName}`
    : `Terminal ${round(distanceKm, 1)} km from ${anchorName}`;
}

function extractDistanceKm(value: string) {
  const match = value.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function adjustPriceForCurrency(baseUsd: number, currencyCode: string) {
  const rates: Record<string, number> = {
    AUD: 1.5,
    BRL: 5.4,
    CAD: 1.36,
    CHF: 0.9,
    CNY: 7.2,
    EUR: 0.92,
    GBP: 0.78,
    HKD: 7.8,
    IDR: 16200,
    INR: 84,
    JPY: 156,
    KRW: 1380,
    MYR: 4.4,
    PHP: 58,
    SAR: 3.75,
    SGD: 1.35,
    THB: 36,
    TWD: 32,
    USD: 1,
    VND: 25500,
  };

  const rate = rates[currencyCode] ?? 1;
  return Math.max(1, Math.round(baseUsd * rate));
}
