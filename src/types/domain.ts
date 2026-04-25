export type ThemePreference = 'system' | 'light' | 'dark';
export type AccentTheme = 'aurora' | 'midnight' | 'citrus';
export type EventCategory =
  | 'focus'
  | 'travel'
  | 'prep'
  | 'budget'
  | 'wellness'
  | 'booking'
  | 'synced';
export type TransportMode = 'walk' | 'rail' | 'ride' | 'shuttle' | 'flight';
export type BudgetCategory = 'stay' | 'transport' | 'food' | 'activities' | 'buffer';
export type DeviceCalendarPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';
export type DeviceLocationPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';
export type ItineraryCategory = 'stay' | 'sights' | 'food' | 'coffee' | 'transit';
export type TransportHubType = 'airport' | 'bus_terminal';
export type TransportLinkMode = 'flight' | 'bus';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Place extends Coordinates {
  id: string;
  name: string;
  subtitle?: string;
  country?: string;
  countryCode?: string;
}

export interface PlannerEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  category: EventCategory;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  description?: string;
  relatedTripId?: string;
  location?: Place;
  transportMode?: TransportMode;
  participantIds?: string[];
  costImpact?: number;
  hiddenInTripMode?: boolean;
  source?: 'planner' | 'device';
  sourceCalendarTitle?: string;
}

export interface QrPass {
  id: string;
  label: string;
  subtitle: string;
  payload: string;
}

export interface CheckInInfo {
  airline: string;
  bookingCode: string;
  flightNumber: string;
  terminal: string;
  gate: string;
  departureAt: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: 'documents' | 'packing' | 'transport' | 'comfort';
  completed: boolean;
  points: number;
  essential: boolean;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  readiness: number;
  color: string;
}

export interface BookingPreference {
  id: string;
  label: string;
  type: 'hotel' | 'flight' | 'rail';
  location: string;
  budgetCeiling: number;
  partySize: number;
  watchWindow: string;
  bookingUrl: string;
}

export interface BookingAlert {
  id: string;
  preferenceId: string;
  title: string;
  status: 'watching' | 'available';
  price: number;
  note: string;
  bookingUrl: string;
  lastCheckedAt: string;
}

export interface BudgetEntry {
  id: string;
  tripId?: string;
  title: string;
  category: BudgetCategory;
  amount: number;
  perPerson: boolean;
  date: string;
}

export interface ItineraryStop {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  place: Place;
  mode: TransportMode;
}

export interface WeatherSnapshot {
  temperature: number;
  condition: string;
  windSpeed: number;
  fetchedAt: string;
}

export interface DeviceCalendarSource {
  id: string;
  title: string;
  color: string;
  ownerAccount?: string | null;
  isPrimary?: boolean;
  allowsModifications: boolean;
  isVisible?: boolean;
}

export interface DeviceCalendarEvent {
  id: string;
  calendarId: string;
  calendarTitle: string;
  calendarColor: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string | null;
  notes?: string | null;
  timeZone?: string | null;
  url?: string | null;
  availability?: string | null;
  status?: string | null;
  organizer?: string | null;
  organizerEmail?: string | null;
  recurrenceText?: string | null;
  alarmsCount: number;
}

export interface DeviceLocationSnapshot {
  latitude: number;
  longitude: number;
  label: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  countryCode?: string | null;
  fetchedAt: string;
}

export interface ItinerarySuggestion {
  id: string;
  title: string;
  category: ItineraryCategory;
  subtitle: string;
  latitude: number;
  longitude: number;
  estimatedPrice: number;
  priceUnit: 'per_person' | 'per_night' | 'per_group';
  provider: string;
  mapsUrl: string;
  bookingUrl: string;
  score: number;
}

export interface TransportHub extends Coordinates {
  id: string;
  name: string;
  subtitle: string;
  type: TransportHubType;
  area: 'origin' | 'destination';
  mapsUrl: string;
  code?: string;
}

export interface TransportConnection {
  id: string;
  mode: TransportLinkMode;
  title: string;
  subtitle: string;
  estimatedPrice: number;
  durationMinutes: number;
  originHub: TransportHub;
  destinationHub: TransportHub;
  mapsUrl: string;
  bookingUrl: string;
}

export interface Trip {
  id: string;
  title: string;
  assistantSummary: string;
  destination: Place;
  destinationImageUrl?: string;
  destinationImageCaption?: string;
  homeBase: Place;
  originCountry?: string;
  destinationCountry?: string;
  currencyCode: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  active: boolean;
  createdAt: string;
  vibe: string;
  checkIn: CheckInInfo;
  qrPasses: QrPass[];
  checklist: ChecklistTask[];
  participants: Participant[];
  itinerary: ItineraryStop[];
  suggestions: ItinerarySuggestion[];
  transportHubs: TransportHub[];
  transportConnections: TransportConnection[];
  bookingPreference: BookingPreference;
  weather?: WeatherSnapshot;
}

export interface PlannerData {
  selectedDate: string;
  tripModeEnabled: boolean;
  activeTripId: string | null;
  themePreference: ThemePreference;
  activeAccentTheme: AccentTheme;
  unlockedThemes: AccentTheme[];
  streak: number;
  rewardPoints: number;
  events: PlannerEvent[];
  trips: Trip[];
  budgetEntries: BudgetEntry[];
  bookingAlerts: BookingAlert[];
  weatherCache: Record<string, WeatherSnapshot>;
  deviceCalendarPermission: DeviceCalendarPermission;
  deviceCalendars: DeviceCalendarSource[];
  deviceCalendarEvents: DeviceCalendarEvent[];
  deviceCalendarLastSyncedAt: string | null;
  deviceLocationPermission: DeviceLocationPermission;
  deviceLocation: DeviceLocationSnapshot | null;
}

export interface PlannerState extends PlannerData {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setSelectedDate: (value: string) => void;
  toggleTripMode: () => void;
  setThemePreference: (value: ThemePreference) => void;
  setAccentTheme: (value: AccentTheme) => void;
  toggleChecklistTask: (tripId: string, taskId: string) => void;
  updateCheckInField: (tripId: string, field: keyof CheckInInfo, value: string) => void;
  addBudgetEntry: (entry: BudgetEntry) => void;
  replaceBudgetEntriesForTrip: (tripId: string, entries: BudgetEntry[]) => void;
  setParticipantsReadiness: (tripId: string, participantId: string, readiness: number) => void;
  refreshBookingAlerts: (alerts: BookingAlert[]) => void;
  updateWeatherSnapshot: (tripId: string, snapshot: WeatherSnapshot) => void;
  setDeviceCalendarPermission: (value: DeviceCalendarPermission) => void;
  syncDeviceCalendarData: (
    calendars: DeviceCalendarSource[],
    events: DeviceCalendarEvent[],
    syncedAt: string,
  ) => void;
  clearDeviceCalendarSync: () => void;
  setDeviceLocation: (
    permission: DeviceLocationPermission,
    snapshot: DeviceLocationSnapshot | null,
  ) => void;
  saveTrip: (trip: Trip) => void;
  setActiveTripId: (tripId: string | null) => void;
}
