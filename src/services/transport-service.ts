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

const hubOrder: TransportHubType[] = [
  'airport',
  'bus_terminal',
  'rail_station',
  'ferry_terminal',
];

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
  const hubGroups = await Promise.all(
    hubOrder.map(async (type) => {
      const overpassResults = await fetchOverpassHubs(place, area, type).catch(() => []);
      if (overpassResults.length) {
        return overpassResults;
      }

      return fetchFallbackSearchHubs(place, area, type).catch(() => []);
    }),
  );

  const deduped = new Map<string, TransportHub>();
  hubGroups.flat().forEach((hub) => {
    const key = `${hub.type}:${hub.name.toLowerCase()}`;
    if (!deduped.has(key)) {
      deduped.set(key, hub);
    }
  });

  return [...deduped.values()].sort((left, right) => {
    const typeDelta = hubOrder.indexOf(left.type) - hubOrder.indexOf(right.type);
    if (typeDelta !== 0) {
      return typeDelta;
    }

    return extractDistanceKm(left.subtitle) - extractDistanceKm(right.subtitle);
  });
}

async function fetchOverpassHubs(
  place: Place,
  area: 'origin' | 'destination',
  type: TransportHubType,
) {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(buildOverpassQuery(place, type))}`,
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
  const queries = buildFallbackQueries(place, type);

  for (const query of queries) {
    const url =
      'https://nominatim.openstreetmap.org/search' +
      `?format=jsonv2&limit=6&q=${encodeURIComponent(query)}` +
      (place.countryCode ? `&countrycodes=${place.countryCode.toLowerCase()}` : '');

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'VoyagrPlanner/1.0 (calendar travel planner)',
      },
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as NominatimPlace[];
    const hubs = payload
      .map((item) => mapSearchResultToHub(item, place, area, type))
      .filter((value): value is TransportHub => Boolean(value));

    if (hubs.length) {
      return hubs;
    }
  }

  return [];
}

function buildOverpassQuery(place: Place, type: TransportHubType) {
  if (type === 'airport') {
    return [
      '[out:json][timeout:25];',
      '(',
      `nwr["aeroway"="aerodrome"]["iata"](around:120000,${place.latitude},${place.longitude});`,
      `nwr["aeroway"="aerodrome"]["icao"](around:120000,${place.latitude},${place.longitude});`,
      `nwr["aeroway"="aerodrome"]["aerodrome:type"~"international|public|regional|civil"](around:120000,${place.latitude},${place.longitude});`,
      ');',
      'out center 60;',
    ].join('');
  }

  if (type === 'bus_terminal') {
    return [
      '[out:json][timeout:25];',
      '(',
      `nwr["amenity"="bus_station"](around:28000,${place.latitude},${place.longitude});`,
      `nwr["highway"="bus_station"](around:28000,${place.latitude},${place.longitude});`,
      ');',
      'out center 60;',
    ].join('');
  }

  if (type === 'rail_station') {
    return [
      '[out:json][timeout:25];',
      '(',
      `nwr["railway"~"station|halt"](around:26000,${place.latitude},${place.longitude});`,
      `nwr["public_transport"="station"](around:26000,${place.latitude},${place.longitude});`,
      ');',
      'out center 60;',
    ].join('');
  }

  return [
    '[out:json][timeout:25];',
    '(',
    `nwr["amenity"="ferry_terminal"](around:26000,${place.latitude},${place.longitude});`,
    `nwr["building"="ferry_terminal"](around:26000,${place.latitude},${place.longitude});`,
    ');',
    'out center 60;',
  ].join('');
}

function buildFallbackQueries(place: Place, type: TransportHubType) {
  const base = [place.name, place.country].filter(Boolean).join(' ');

  if (type === 'airport') {
    return [`${base} airport`, `${base} international airport`];
  }

  if (type === 'bus_terminal') {
    return [`${base} bus terminal`, `${base} bus station`];
  }

  if (type === 'rail_station') {
    return [`${base} railway station`, `${base} train station`];
  }

  return [`${base} ferry terminal`, `${base} port terminal`];
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
  if (!type || type !== expectedType || !isVerifiedHub(tags, type)) {
    return null;
  }

  const distanceKm = haversineKm(anchor, coordinates);
  if (distanceKm > getMaxDistanceKm(type)) {
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
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  if (!looksLikeTransportHub(item, expectedType)) {
    return null;
  }

  const distanceKm = haversineKm(anchor, { latitude, longitude });
  if (distanceKm > getSearchMaxDistanceKm(expectedType)) {
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

  if (
    tags.railway === 'station' ||
    tags.railway === 'halt' ||
    tags.public_transport === 'station'
  ) {
    return 'rail_station';
  }

  if (tags.amenity === 'ferry_terminal' || tags.building === 'ferry_terminal') {
    return 'ferry_terminal';
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

  if (type === 'bus_terminal') {
    return name.includes('bus') || name.includes('terminal') || name.includes('station');
  }

  if (type === 'rail_station') {
    return name.includes('station') || Boolean(tags.railway === 'station' || tags.railway === 'halt');
  }

  return (
    name.includes('ferry') ||
    name.includes('pier') ||
    name.includes('port') ||
    name.includes('harbor') ||
    name.includes('harbour') ||
    name.includes('terminal')
  );
}

function looksLikeTransportHub(item: NominatimPlace, type: TransportHubType) {
  const searchText = `${item.display_name} ${item.type ?? ''} ${item.category ?? ''}`.toLowerCase();

  if (type === 'airport') {
    return searchText.includes('airport');
  }

  if (type === 'bus_terminal') {
    return ['bus station', 'bus terminal', 'transport terminal'].some((keyword) =>
      searchText.includes(keyword),
    );
  }

  if (type === 'rail_station') {
    return ['railway station', 'train station', 'station', 'rail'].some((keyword) =>
      searchText.includes(keyword),
    );
  }

  return ['ferry', 'pier', 'port', 'harbor', 'harbour'].some((keyword) =>
    searchText.includes(keyword),
  );
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
  const originRailStations = hubs.filter(
    (hub) => hub.area === 'origin' && hub.type === 'rail_station',
  );
  const destinationRailStations = hubs.filter(
    (hub) => hub.area === 'destination' && hub.type === 'rail_station',
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

  const railOptions =
    distanceKm <= 760
      ? originRailStations.flatMap((originHub) =>
          destinationRailStations.map((destinationHub, index) =>
            createRailConnection(originHub, destinationHub, distanceKm, currencyCode, index),
          ),
        )
      : [];

  return [...flightOptions, ...busOptions, ...railOptions]
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
    subtitle: 'Verified airport route built from live hub data',
    estimatedPrice: adjustPriceForCurrency(basePrice, currencyCode),
    durationMinutes,
    originHub,
    destinationHub,
    mapsUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub, 'driving'),
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
    subtitle: 'Verified bus-terminal route with local fare estimate',
    estimatedPrice: adjustPriceForCurrency(basePrice, currencyCode),
    durationMinutes,
    originHub,
    destinationHub,
    mapsUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub, 'transit'),
    bookingUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub, 'transit'),
  };
}

function createRailConnection(
  originHub: TransportHub,
  destinationHub: TransportHub,
  distanceKm: number,
  currencyCode: string,
  index: number,
): TransportConnection {
  const basePrice = clamp(Math.round(distanceKm * 0.05 + 14 + index * 6), 12, 420);
  const durationMinutes = Math.round((distanceKm / 90) * 60 + 35 + index * 8);

  return {
    id: `rail-${originHub.id}-${destinationHub.id}`,
    mode: 'rail',
    title: `${formatHubName(originHub)} to ${formatHubName(destinationHub)}`,
    subtitle: 'Verified rail-station route with local fare estimate',
    estimatedPrice: adjustPriceForCurrency(basePrice, currencyCode),
    durationMinutes,
    originHub,
    destinationHub,
    mapsUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub, 'transit'),
    bookingUrl: buildMapsDirectionsUrl(destinationHub, destinationHub.name, originHub, 'transit'),
  };
}

function formatHubName(hub: TransportHub) {
  return hub.code ? `${hub.name} (${hub.code})` : hub.name;
}

function buildHubSubtitle(type: TransportHubType, distanceKm: number, anchorName: string) {
  if (type === 'airport') {
    return `${round(distanceKm, 1)} km from ${anchorName}`;
  }

  if (type === 'bus_terminal') {
    return `Bus terminal ${round(distanceKm, 1)} km from ${anchorName}`;
  }

  if (type === 'rail_station') {
    return `Rail station ${round(distanceKm, 1)} km from ${anchorName}`;
  }

  return `Ferry terminal ${round(distanceKm, 1)} km from ${anchorName}`;
}

function getMaxDistanceKm(type: TransportHubType) {
  if (type === 'airport') {
    return 140;
  }

  if (type === 'bus_terminal') {
    return 30;
  }

  return 26;
}

function getSearchMaxDistanceKm(type: TransportHubType) {
  if (type === 'airport') {
    return 160;
  }

  if (type === 'bus_terminal') {
    return 35;
  }

  return 30;
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
