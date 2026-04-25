import {
  addDays,
  differenceInCalendarDays,
  parseISO,
  set,
  startOfDay,
} from 'date-fns';

import {
  BudgetEntry,
  BudgetCategory,
  ChecklistTask,
  DeviceLocationSnapshot,
  ItineraryCategory,
  ItineraryStop,
  ItinerarySuggestion,
  Participant,
  Place,
  TransportConnection,
  TransportHub,
  Trip,
  TransportMode,
} from '@/types/domain';
import {
  buildBookingSearchUrl,
  buildMapsDirectionsUrl,
  buildMapsSearchUrl,
} from '@/services/maps-service';
import { fetchDestinationMedia } from '@/services/destination-media-service';
import { fetchTransportContext } from '@/services/transport-service';
import {
  estimateTravelMinutes,
  getTransportSuggestion,
} from '@/services/travel-heuristics';
import { clamp, haversineKm } from '@/utils/math';
import { resolveCurrencyContext } from '@/utils/locale';

interface DestinationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: DestinationResult[];
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

export interface PlanTripInput {
  destinationQuery: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  budgetCeiling: number;
  interests: string[];
  request: string;
  origin?: DeviceLocationSnapshot | null;
}

export interface PlannedTripPayload {
  trip: Trip;
  budgetEntries: BudgetEntry[];
}

const categoryOrder: ItineraryCategory[] = [
  'transit',
  'stay',
  'coffee',
  'sights',
  'food',
];

export async function planTripWithAssistant(
  input: PlanTripInput,
): Promise<PlannedTripPayload> {
  const destination = await geocodeDestination(input.destinationQuery);
  const currencyContext = resolveCurrencyContext(
    destination.countryCode,
    destination.country,
  );
  const suggestions =
    (await fetchItinerarySuggestions(destination, input).catch(() => [])) || [];
  const rankedSuggestions = rankSuggestions(suggestions);
  const resolvedSuggestions = await fillMissingSuggestionCategories(
    destination,
    input,
    rankedSuggestions,
  );

  const homeBase = input.origin ? mapOriginToPlace(input.origin) : destination;
  const destinationMedia = await fetchDestinationMedia(
    destination.name,
    destination.country,
  ).catch(() => null);
  const transportContext =
    (await fetchTransportContext(homeBase, destination, currencyContext.currency).catch(
      () => null,
    )) ?? null;

  const trip = buildTrip(
    destination,
    homeBase,
    resolvedSuggestions,
    input,
    currencyContext.currency,
    destinationMedia?.imageUrl,
    destinationMedia?.caption,
    transportContext?.hubs ?? [],
    transportContext?.connections ?? [],
  );

  return {
    trip,
    budgetEntries: buildBudgetEntries(trip.id, resolvedSuggestions, input, trip.startDate),
  };
}

async function geocodeDestination(query: string): Promise<Place> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query,
    )}&count=1&language=en&format=json`,
  );

  if (!response.ok) {
    throw new Error('Destination search failed');
  }

  const payload = (await response.json()) as GeocodingResponse;
  const result = payload.results?.[0];

  if (!result) {
    throw new Error('No destination found');
  }

  return {
    id: `geo-${result.id}`,
    name: result.name,
    subtitle: [result.admin1, result.country].filter(Boolean).join(', '),
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    countryCode: result.country_code?.toUpperCase(),
  };
}

async function fetchItinerarySuggestions(
  destination: Place,
  input: PlanTripInput,
): Promise<ItinerarySuggestion[]> {
  const query = [
    '[out:json][timeout:25];',
    '(',
    `nwr["tourism"~"hotel|hostel|guest_house|apartment"](around:3800,${destination.latitude},${destination.longitude});`,
    `nwr["tourism"~"attraction|museum|gallery|viewpoint|theme_park|zoo"](around:4500,${destination.latitude},${destination.longitude});`,
    `nwr["amenity"~"restaurant|food_court|bar"](around:2600,${destination.latitude},${destination.longitude});`,
    `nwr["amenity"~"cafe|coffee_shop"](around:2600,${destination.latitude},${destination.longitude});`,
    `nwr["public_transport"](around:1800,${destination.latitude},${destination.longitude});`,
    `nwr["railway"~"station|tram_stop|subway_entrance"](around:1800,${destination.latitude},${destination.longitude});`,
    ');',
    'out center 80;',
  ].join('');

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('Itinerary search failed');
  }

  const payload = (await response.json()) as OverpassResponse;
  const countryHint = destination.country ?? destination.subtitle?.split(',').at(-1)?.trim();

  return payload.elements
    .map((element, index) =>
      mapOverpassElementToSuggestion(element, index, destination, input, countryHint),
    )
    .filter((value): value is ItinerarySuggestion => Boolean(value));
}

function mapOverpassElementToSuggestion(
  element: OverpassElement,
  index: number,
  destination: Place,
  input: PlanTripInput,
  countryHint?: string,
): ItinerarySuggestion | null {
  const coordinates = element.center
    ? { latitude: element.center.lat, longitude: element.center.lon }
    : element.lat && element.lon
      ? { latitude: element.lat, longitude: element.lon }
      : null;

  if (!coordinates || !element.tags) {
    return null;
  }

  const category = detectItineraryCategory(element.tags);
  if (!category) {
    return null;
  }

  const title = element.tags.name?.trim();
  if (!title) {
    return null;
  }
  const subtitle = buildSuggestionSubtitle(element.tags, category);

  return {
    id: `poi-${element.id}`,
    title,
    category,
    subtitle,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    estimatedPrice: estimateSuggestionPrice(category, index, input, countryHint),
    priceUnit: priceUnitForCategory(category, input.groupSize),
    provider: providerLabelForCategory(category),
    mapsUrl: buildMapsSearchUrl(title, coordinates),
    bookingUrl:
      category === 'stay'
        ? buildBookingSearchUrl(`${title}, ${destination.name}`)
        : buildMapsDirectionsUrl(
            coordinates,
            title,
            input.origin
              ? {
                  latitude: input.origin.latitude,
                  longitude: input.origin.longitude,
                }
              : undefined,
          ),
    score: scoreSuggestion(category, coordinates, destination, input),
  };
}

function detectItineraryCategory(
  tags: Record<string, string>,
): ItineraryCategory | null {
  if (tags.tourism && ['hotel', 'hostel', 'guest_house', 'apartment'].includes(tags.tourism)) {
    return 'stay';
  }

  if (tags.amenity && ['cafe', 'coffee_shop'].includes(tags.amenity)) {
    return 'coffee';
  }

  if (tags.amenity && ['restaurant', 'food_court', 'bar'].includes(tags.amenity)) {
    return 'food';
  }

  if (
    tags.public_transport ||
    (tags.railway && ['station', 'tram_stop', 'subway_entrance'].includes(tags.railway))
  ) {
    return 'transit';
  }

  if (
    tags.tourism &&
    ['attraction', 'museum', 'gallery', 'viewpoint', 'theme_park', 'zoo'].includes(tags.tourism)
  ) {
    return 'sights';
  }

  return null;
}

function buildSuggestionSubtitle(
  tags: Record<string, string>,
  category: ItineraryCategory,
) {
  const detail =
    tags['addr:street'] ||
    tags.neighbourhood ||
    tags.brand ||
    tags.operator ||
    tags.tourism ||
    tags.amenity ||
    'Local option';
  const categoryCopy =
    category === 'stay'
      ? 'Stay'
      : category === 'food'
        ? 'Food'
        : category === 'coffee'
          ? 'Coffee'
          : category === 'transit'
            ? 'Transit'
            : 'Sights';

  return `${categoryCopy} - ${detail}`;
}

function priceUnitForCategory(
  category: ItineraryCategory,
  groupSize: number,
): ItinerarySuggestion['priceUnit'] {
  if (category === 'stay') {
    return 'per_night';
  }
  if (category === 'transit' && groupSize > 3) {
    return 'per_group';
  }
  return 'per_person';
}

function providerLabelForCategory(category: ItineraryCategory) {
  if (category === 'stay') {
    return 'Booking search';
  }
  if (category === 'transit') {
    return 'Maps route';
  }
  return 'OpenStreetMap';
}

function estimateSuggestionPrice(
  category: ItineraryCategory,
  index: number,
  input: PlanTripInput,
  countryHint?: string,
) {
  const tripDays = Math.max(
    1,
    differenceInCalendarDays(toDate(input.endDate), toDate(input.startDate)) || 1,
  );
  const factor = destinationCostFactor(countryHint);
  const base =
    category === 'stay'
      ? input.budgetCeiling * 0.34 / tripDays
      : category === 'food'
        ? input.budgetCeiling * 0.08 / Math.max(input.groupSize, 1)
        : category === 'coffee'
          ? 6
          : category === 'transit'
            ? input.groupSize > 3
              ? input.budgetCeiling * 0.06
              : input.budgetCeiling * 0.04 / Math.max(input.groupSize, 1)
            : input.budgetCeiling * 0.05 / Math.max(input.groupSize, 1);

  const bump = category === 'stay' ? 18 : category === 'food' ? 5 : 2;
  return Math.max(4, Math.round(base * factor + index * bump));
}

function destinationCostFactor(countryHint?: string) {
  const label = countryHint?.toLowerCase() ?? '';
  if (
    ['switzerland', 'singapore', 'japan', 'united states', 'united kingdom'].includes(label)
  ) {
    return 1.18;
  }
  if (['thailand', 'vietnam', 'philippines', 'indonesia', 'malaysia'].includes(label)) {
    return 0.82;
  }
  return 1;
}

function scoreSuggestion(
  category: ItineraryCategory,
  coordinates: { latitude: number; longitude: number },
  destination: Place,
  input: PlanTripInput,
) {
  const distancePenalty = haversineKm(coordinates, destination) * 4.2;
  const interestBonus = input.interests.some((interest) =>
    interestMatchesCategory(interest, category),
  )
    ? 16
    : 0;
  const categoryBias =
    category === 'stay' ? 12 : category === 'sights' ? 8 : category === 'food' ? 6 : 0;

  return clamp(Math.round(92 - distancePenalty + interestBonus + categoryBias), 48, 99);
}

function interestMatchesCategory(interest: string, category: ItineraryCategory) {
  const normalized = interest.toLowerCase();
  return (
    (normalized === 'food' && category === 'food') ||
    (normalized === 'coffee' && category === 'coffee') ||
    ((normalized === 'culture' || normalized === 'nature') && category === 'sights') ||
    (normalized === 'easy' && category === 'transit')
  );
}

function rankSuggestions(suggestions: ItinerarySuggestion[]) {
  const deduped = new Map<string, ItinerarySuggestion>();

  suggestions
    .sort((left, right) => right.score - left.score)
    .forEach((suggestion) => {
      const key = `${suggestion.category}:${suggestion.title.toLowerCase()}`;
      if (!deduped.has(key)) {
        deduped.set(key, suggestion);
      }
    });

  const limited = categoryOrder.flatMap((category) =>
    [...deduped.values()]
      .filter((suggestion) => suggestion.category === category)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3),
  );

  return limited;
}

async function fillMissingSuggestionCategories(
  destination: Place,
  input: PlanTripInput,
  suggestions: ItinerarySuggestion[],
) {
  const existingCategories = new Set(suggestions.map((suggestion) => suggestion.category));
  const missingCategories = categoryOrder.filter((category) => !existingCategories.has(category));
  const fallbackSuggestions = await Promise.all(
    missingCategories.map((category) =>
      fetchSearchFallbackSuggestion(destination, input, category, suggestions),
    ),
  );

  return [...suggestions, ...fallbackSuggestions.filter((value): value is ItinerarySuggestion => Boolean(value))].sort(
    (left, right) => {
      const categoryDelta =
        categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category);
      return categoryDelta !== 0 ? categoryDelta : right.score - left.score;
    },
  );
}

async function fetchSearchFallbackSuggestion(
  destination: Place,
  input: PlanTripInput,
  category: ItineraryCategory,
  existingSuggestions: ItinerarySuggestion[],
) {
  const existingTitles = new Set(
    existingSuggestions.map((suggestion) => suggestion.title.trim().toLowerCase()),
  );

  for (const query of buildCategorySearchQueries(destination, category)) {
    const matches = await searchCategorySuggestions(destination, input, category, query);
    const uniqueMatch = matches.find(
      (suggestion) => !existingTitles.has(suggestion.title.trim().toLowerCase()),
    );

    if (uniqueMatch) {
      return uniqueMatch;
    }
  }

  return null;
}

async function searchCategorySuggestions(
  destination: Place,
  input: PlanTripInput,
  category: ItineraryCategory,
  query: string,
) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=jsonv2&limit=6&q=${encodeURIComponent(query)}` +
    (destination.countryCode ? `&countrycodes=${destination.countryCode.toLowerCase()}` : '');

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
    .map((item, index) =>
      mapSearchResultToSuggestion(item, destination, input, category, index),
    )
    .filter((value): value is ItinerarySuggestion => Boolean(value));
}

function buildCategorySearchQueries(destination: Place, category: ItineraryCategory) {
  const locationLabel = [destination.name, destination.country].filter(Boolean).join(' ');

  if (category === 'stay') {
    return [`${locationLabel} hotel`, `${locationLabel} accommodation`];
  }

  if (category === 'transit') {
    return [
      `${locationLabel} railway station`,
      `${locationLabel} bus terminal`,
      `${locationLabel} transport hub`,
    ];
  }

  if (category === 'coffee') {
    return [`${locationLabel} cafe`, `${locationLabel} coffee shop`];
  }

  if (category === 'food') {
    return [`${locationLabel} restaurant`, `${locationLabel} food`];
  }

  return [`${locationLabel} museum`, `${locationLabel} tourist attraction`];
}

function mapSearchResultToSuggestion(
  item: NominatimPlace,
  destination: Place,
  input: PlanTripInput,
  category: ItineraryCategory,
  index: number,
): ItinerarySuggestion | null {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  const distanceKm = haversineKm(destination, { latitude, longitude });
  if (distanceKm > getSearchRadiusKm(category)) {
    return null;
  }

  if (!matchesCategorySearch(item, category)) {
    return null;
  }

  const title = item.name?.trim() || item.display_name.split(',')[0]?.trim();
  if (!title) {
    return null;
  }

  const subtitle = buildSearchSuggestionSubtitle(item, category);

  return {
    id: `search-${category}-${item.place_id}`,
    title,
    category,
    subtitle,
    latitude,
    longitude,
    estimatedPrice: estimateSuggestionPrice(category, index, input, destination.country),
    priceUnit: priceUnitForCategory(category, input.groupSize),
    provider: providerLabelForCategory(category),
    mapsUrl: buildMapsSearchUrl(title, { latitude, longitude }),
    bookingUrl:
      category === 'stay'
        ? buildBookingSearchUrl(`${title}, ${destination.name}`)
        : buildMapsDirectionsUrl(
            { latitude, longitude },
            title,
            input.origin
              ? {
                  latitude: input.origin.latitude,
                  longitude: input.origin.longitude,
                }
              : undefined,
          ),
    score: clamp(Math.round(86 - distanceKm * 2.8 - index * 3), 44, 88),
  };
}

function buildSearchSuggestionSubtitle(
  item: NominatimPlace,
  category: ItineraryCategory,
) {
  const locationParts = item.display_name
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(1, 4)
    .join(', ');
  const categoryLabel =
    category === 'stay'
      ? 'Stay'
      : category === 'food'
        ? 'Food'
        : category === 'coffee'
          ? 'Coffee'
          : category === 'transit'
            ? 'Transit'
            : 'Sights';

  return `${categoryLabel} - ${locationParts || item.type || item.category || 'Nearby match'}`;
}

function matchesCategorySearch(item: NominatimPlace, category: ItineraryCategory) {
  const searchText = `${item.display_name} ${item.type ?? ''} ${item.category ?? ''}`.toLowerCase();

  if (category === 'stay') {
    return ['hotel', 'hostel', 'guest house', 'guesthouse', 'apartment', 'accommodation'].some(
      (keyword) => searchText.includes(keyword),
    );
  }

  if (category === 'transit') {
    return ['station', 'terminal', 'transport', 'bus', 'rail', 'airport'].some((keyword) =>
      searchText.includes(keyword),
    );
  }

  if (category === 'coffee') {
    return ['cafe', 'coffee'].some((keyword) => searchText.includes(keyword));
  }

  if (category === 'food') {
    return ['restaurant', 'food', 'kitchen', 'diner', 'bar'].some((keyword) =>
      searchText.includes(keyword),
    );
  }

  return ['museum', 'gallery', 'viewpoint', 'park', 'attraction', 'tourism', 'beach', 'plaza'].some(
    (keyword) => searchText.includes(keyword),
  );
}

function getSearchRadiusKm(category: ItineraryCategory) {
  if (category === 'stay') {
    return 18;
  }

  if (category === 'transit') {
    return 24;
  }

  return 12;
}

function buildTrip(
  destination: Place,
  homeBase: Place,
  suggestions: ItinerarySuggestion[],
  input: PlanTripInput,
  currencyCode: string,
  destinationImageUrl: string | undefined,
  destinationImageCaption: string | undefined,
  transportHubs: TransportHub[],
  transportConnections: TransportConnection[],
): Trip {
  const tripId = `trip-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const startDate = toDate(input.startDate).toISOString();
  const endDate = normalizeEndDate(input.startDate, input.endDate).toISOString();
  const itinerary = buildItinerary(destination, suggestions, input, startDate, homeBase);
  const staySuggestion = suggestions.find((suggestion) => suggestion.category === 'stay');
  const tripDays = Math.max(
    1,
    differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) || 1,
  );

  return {
    id: tripId,
    title: `${destination.name} trip`,
    assistantSummary: `${tripDays}-day plan for ${input.groupSize} traveler${input.groupSize > 1 ? 's' : ''} with ${describeInterestMix(input.interests)} focus.`,
    destination,
    destinationImageUrl,
    destinationImageCaption,
    homeBase,
    originCountry: homeBase.country,
    destinationCountry: destination.country,
    currencyCode,
    startDate,
    endDate,
    groupSize: input.groupSize,
    active: true,
    createdAt,
    vibe: input.request.trim()
      ? input.request.trim()
      : `${getTransportSuggestion(input.groupSize)} with a ${describeInterestMix(input.interests)} plan.`,
    checkIn: {
      airline: '',
      bookingCode: '',
      flightNumber: '',
      terminal: '',
      gate: '',
      departureAt: itinerary[0]?.time ?? startDate,
    },
    qrPasses: [],
    checklist: buildChecklist(tripDays),
    participants: buildParticipants(input.groupSize),
    itinerary,
    suggestions,
    transportHubs,
    transportConnections,
    bookingPreference: {
      id: `booking-${tripId}`,
      label: staySuggestion?.title ?? `${destination.name} stay search`,
      type: 'hotel',
      location: destination.name,
      budgetCeiling: Math.max(80, Math.round(input.budgetCeiling * 0.34 / tripDays)),
      partySize: input.groupSize,
      watchWindow: `${input.startDate} to ${input.endDate}`,
      bookingUrl: buildBookingSearchUrl(`${destination.name} stay`),
    },
  };
}

function buildChecklist(tripDays: number): ChecklistTask[] {
  return [
    {
      id: 'docs',
      title: 'Review IDs, tickets, and reservation emails',
      category: 'documents',
      completed: false,
      points: 40,
      essential: true,
    },
    {
      id: 'maps',
      title: 'Download offline maps and key addresses',
      category: 'transport',
      completed: false,
      points: 24,
      essential: true,
    },
    {
      id: 'pack',
      title: `Pack outfits and chargers for ${tripDays} day${tripDays > 1 ? 's' : ''}`,
      category: 'packing',
      completed: false,
      points: 32,
      essential: true,
    },
    {
      id: 'money',
      title: 'Set payment backup and spending buffer',
      category: 'comfort',
      completed: false,
      points: 18,
      essential: false,
    },
    {
      id: 'rides',
      title: 'Confirm first transfer and arrival route',
      category: 'transport',
      completed: false,
      points: 20,
      essential: true,
    },
  ];
}

function buildParticipants(groupSize: number): Participant[] {
  const colors = ['#A9A0E8', '#CBE7A8', '#FFD57A', '#8ED4C4', '#F6B8A8'];

  return Array.from({ length: Math.max(groupSize, 1) }, (_, index) => ({
    id: `participant-${index + 1}`,
    name: index === 0 ? 'You' : `Traveler ${index + 1}`,
    role: index === 0 ? 'Lead' : 'Companion',
    readiness: index === 0 ? 64 : 56,
    color: colors[index % colors.length],
  }));
}

function buildItinerary(
  destination: Place,
  suggestions: ItinerarySuggestion[],
  input: PlanTripInput,
  startDate: string,
  homeBase: Place,
): ItineraryStop[] {
  const baseDate = parseISO(startDate);
  const transit = suggestions.find((suggestion) => suggestion.category === 'transit');
  const stay = suggestions.find((suggestion) => suggestion.category === 'stay');
  const coffee = suggestions.find((suggestion) => suggestion.category === 'coffee');
  const sights = suggestions.find((suggestion) => suggestion.category === 'sights');
  const food = suggestions.find((suggestion) => suggestion.category === 'food');
  const routeMinutes = estimateTravelMinutes(homeBase, destination, input.groupSize);

  const stops: {
    title: string;
    subtitle: string;
    dayOffset: number;
    hour: number;
    minute: number;
    place: Place;
    mode: TransportMode;
  }[] = [];

  if (transit) {
    stops.push({
      title: 'Arrival route',
      subtitle: `${transit.title} - ${routeMinutes} min from current base`,
      dayOffset: 0,
      hour: 9,
      minute: 0,
      place: suggestionToPlace(transit),
      mode: input.groupSize > 3 ? 'shuttle' : 'ride',
    });
  }

  if (stay) {
    stops.push({
      title: 'Check in',
      subtitle: stay.title,
      dayOffset: 0,
      hour: 11,
      minute: 30,
      place: suggestionToPlace(stay),
      mode: 'walk',
    });
  }

  if (coffee) {
    stops.push({
      title: 'Coffee reset',
      subtitle: coffee.title,
      dayOffset: 0,
      hour: 13,
      minute: 30,
      place: suggestionToPlace(coffee),
      mode: 'walk',
    });
  }

  if (sights) {
    stops.push({
      title: 'Main explore block',
      subtitle: sights.title,
      dayOffset: 0,
      hour: 15,
      minute: 30,
      place: suggestionToPlace(sights),
      mode: 'rail',
    });
  }

  if (food) {
    stops.push({
      title: 'Dinner booking',
      subtitle: food.title,
      dayOffset: 0,
      hour: 19,
      minute: 0,
      place: suggestionToPlace(food),
      mode: 'walk',
    });
  }

  return stops.map((stop, index) => ({
    id: `stop-${index + 1}`,
    title: stop.title,
    subtitle: stop.subtitle,
    time: buildStopTime(baseDate, stop.dayOffset, stop.hour, stop.minute),
    place: stop.place,
    mode: stop.mode,
  }));
}

function suggestionToPlace(suggestion: ItinerarySuggestion): Place {
  return {
    id: suggestion.id,
    name: suggestion.title,
    subtitle: suggestion.subtitle,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
  };
}

function buildBudgetEntries(
  tripId: string,
  suggestions: ItinerarySuggestion[],
  input: PlanTripInput,
  startDate: string,
): BudgetEntry[] {
  const topByCategory = (category: ItineraryCategory) =>
    suggestions.find((suggestion) => suggestion.category === category);

  return [
    toBudgetEntry(tripId, topByCategory('stay'), 'stay', startDate),
    toBudgetEntry(tripId, topByCategory('transit'), 'transport', startDate),
    toBudgetEntry(tripId, topByCategory('food'), 'food', startDate),
    toBudgetEntry(tripId, topByCategory('sights'), 'activities', startDate),
    {
      id: `budget-buffer-${tripId}`,
      tripId,
      title: 'Flex buffer',
      category: 'buffer',
      amount: Math.round(input.budgetCeiling * 0.12),
      perPerson: false,
      date: startDate,
    },
  ].filter((entry): entry is BudgetEntry => Boolean(entry));
}

function toBudgetEntry(
  tripId: string,
  suggestion: ItinerarySuggestion | undefined,
  category: BudgetCategory,
  date: string,
): BudgetEntry | null {
  if (!suggestion) {
    return null;
  }

  return {
    id: `budget-${tripId}-${category}`,
    tripId,
    title: suggestion.title,
    category,
    amount: suggestion.estimatedPrice,
    perPerson: suggestion.priceUnit === 'per_person',
    date,
  };
}

function describeInterestMix(interests: string[]) {
  if (!interests.length) {
    return 'balanced';
  }
  if (interests.length === 1) {
    return interests[0].toLowerCase();
  }
  return `${interests[0].toLowerCase()} + ${interests[1].toLowerCase()}`;
}

function normalizeEndDate(startDate: string, endDate: string) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  return end >= start ? end : addDays(start, 1);
}

function toDate(value: string) {
  return startOfDay(parseISO(value));
}

function buildStopTime(baseDate: Date, dayOffset: number, hour: number, minute: number) {
  return set(addDays(baseDate, dayOffset), {
    hours: hour,
    minutes: minute,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();
}

function mapOriginToPlace(origin: DeviceLocationSnapshot): Place {
  return {
    id: 'device-home-base',
    name: origin.city ?? origin.label,
    subtitle: [origin.region, origin.country].filter(Boolean).join(', '),
    latitude: origin.latitude,
    longitude: origin.longitude,
    country: origin.country ?? undefined,
    countryCode: origin.countryCode ?? undefined,
  };
}
