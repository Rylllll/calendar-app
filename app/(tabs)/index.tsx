import { router } from 'expo-router';
import { isAfter, parseISO } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedMenuButton } from '@/components/navigation/animated-menu-button';
import { BudgetOverviewCard } from '@/components/planner/budget-overview-card';
import { DayTimeline } from '@/components/planner/day-timeline';
import { DeviceCalendarSyncCard } from '@/components/planner/device-calendar-sync-card';
import { JourneyBridgeCard } from '@/components/planner/journey-bridge-card';
import { LocationSyncCard } from '@/components/planner/location-sync-card';
import { MiniCalendar } from '@/components/planner/mini-calendar';
import { Pill } from '@/components/ui/pill';
import { ScreenShell } from '@/components/ui/screen-shell';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBudget } from '@/hooks/use-budget';
import { useCalendar } from '@/hooks/use-calendar';
import { useDeviceCalendar } from '@/hooks/use-device-calendar';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useTrip } from '@/hooks/use-trip';
import { DeviceCalendarEvent, Trip } from '@/types/domain';
import { formatShortDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

export default function HomeScreen() {
  const theme = useAppTheme();
  const { days, combinedAgenda, selectedDate, setSelectedDate } = useCalendar();
  const budget = useBudget();
  const trip = useTrip();
  const deviceCalendar = useDeviceCalendar();
  const deviceLocation = useDeviceLocation();

  const upcomingTrips = [...trip.trips]
    .filter((item) => isAfter(new Date(item.endDate), new Date()))
    .sort(
      (left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime(),
    );
  const travelEvents = deviceCalendar.upcomingDeviceEvents.filter(isTravelCalendarEvent);
  const summaryItems = buildSummaryItems(upcomingTrips, travelEvents).slice(0, 5);
  const subtitle =
    summaryItems.length > 0
      ? `${summaryItems.length} upcoming plan${summaryItems.length > 1 ? 's' : ''} across trips and your phone calendar.`
      : 'Sync your phone calendar or build a trip to start populating the planner.';

  return (
    <ScreenShell
      title="Task Schedule"
      subtitle={subtitle}
      rightAction={
        <AnimatedMenuButton
          actions={[
            {
              id: 'trip',
              label: 'Trip planner',
              icon: 'map-search-outline',
              onPress: () => router.push('/(tabs)/trip'),
            },
            {
              id: 'map',
              label: 'Map itinerary',
              icon: 'map-marker-path',
              onPress: () => router.push('/map-itinerary'),
            },
            {
              id: 'location',
              label: 'Sync location',
              icon: 'crosshairs-gps',
              onPress: () => void deviceLocation.syncCurrentLocation(),
            },
            {
              id: 'calendar',
              label: 'Sync calendar',
              icon: 'calendar-sync-outline',
              onPress: () => void deviceCalendar.syncPhoneCalendar(),
            },
          ]}
        />
      }>
      <View style={styles.pillRow}>
        <Pill label={`${upcomingTrips.length} saved trips`} tone="dark" />
        <Pill
          label={`${deviceCalendar.deviceCalendarEvents.length} synced events`}
          tone="secondary"
        />
        {trip.activeTrip ? (
          <Pill label={`${trip.reminders.length} reminders`} tone="secondary" />
        ) : null}
        {deviceLocation.deviceLocation ? (
          <Pill
            label={deviceLocation.deviceLocation.city ?? deviceLocation.deviceLocation.label}
            tone="secondary"
          />
        ) : null}
      </View>

      <SectionCard variant="accent">
        <Text style={[styles.heroEyebrow, { color: theme.colors.textMuted }]}>
          Plans and travels
        </Text>
        <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
          {upcomingTrips[0]
            ? `Next trip: ${upcomingTrips[0].destination.name}`
            : 'Your dashboard is ready for live data'}
        </Text>
        <Text style={[styles.heroCaption, { color: theme.colors.textMuted }]}>
          {upcomingTrips[0]
            ? `${formatShortDate(upcomingTrips[0].startDate)} to ${formatShortDate(upcomingTrips[0].endDate)} - ${upcomingTrips[0].assistantSummary}`
            : 'Trip plans, calendar events, and current location all stay local-first on the device.'}
        </Text>
        <View style={styles.metrics}>
          <Metric
            label="Today"
            value={String(
              combinedAgenda.length + trip.predictiveBlocks.length + trip.smartScheduleBlocks.length,
            )}
          />
          <Metric label="Travel" value={String(upcomingTrips.length + travelEvents.length)} />
          <Metric
            label="Budget"
            value={formatCurrency(Math.max(budget.remaining, 0), {
              currency: budget.currencyCode,
              locale: budget.currencyLocale,
            })}
          />
        </View>
      </SectionCard>

      <JourneyBridgeCard
        trip={trip.activeTrip}
        instruction={
          trip.activeTrip
            ? 'Start here for the overview, then open Calendar to verify timing and Budget to keep the trip inside the local currency cap.'
            : 'Create the trip in the Trip tab first, then this dashboard will summarize the route, timing, and budget automatically.'
        }
      />

      <MiniCalendar days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />

      <LocationSyncCard
        permission={deviceLocation.deviceLocationPermission}
        location={deviceLocation.deviceLocation}
        loading={deviceLocation.loading}
        mapsUrl={deviceLocation.deviceLocationMapsUrl}
        onSync={() => void deviceLocation.syncCurrentLocation()}
      />

      <DeviceCalendarSyncCard
        permission={deviceCalendar.deviceCalendarPermission}
        calendars={deviceCalendar.deviceCalendars}
        eventsCount={deviceCalendar.deviceCalendarEvents.length}
        loading={deviceCalendar.loading}
        lastSyncedAt={deviceCalendar.deviceCalendarLastSyncedAt}
        onSync={() => void deviceCalendar.syncPhoneCalendar()}
      />

      <SectionCard>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Summary of plans and travels
          </Text>
          <Text style={[styles.sectionCaption, { color: theme.colors.textMuted }]}>
            {summaryItems.length} upcoming
          </Text>
        </View>
        {summaryItems.length ? (
          <View style={styles.summaryList}>
            {summaryItems.map((item) => (
              <View
                key={item.id}
                style={[styles.summaryRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
                <View style={styles.summaryBody}>
                  <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.summaryMeta, { color: theme.colors.textMuted }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <Pill label={item.kind} tone={item.kind === 'Trip' ? 'dark' : 'secondary'} />
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
            No real plans are loaded yet. Sync your phone calendar or create a trip in the Trip
            tab.
          </Text>
        )}
      </SectionCard>

      <DayTimeline
        events={[...trip.predictiveBlocks, ...trip.smartScheduleBlocks, ...combinedAgenda]}
        title="Smart day plan"
      />

      <BudgetOverviewCard
        total={budget.total}
        target={budget.target}
        remaining={budget.remaining}
        suggestions={budget.suggestions}
        currencyCode={budget.currencyCode}
        currencyLocale={budget.currencyLocale}
      />
    </ScreenShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function buildSummaryItems(trips: Trip[], events: DeviceCalendarEvent[]) {
  const tripItems = trips.map((item) => ({
    id: item.id,
    date: item.startDate,
    title: item.title,
    subtitle: `${formatShortDate(item.startDate)} - ${item.destination.name} - ${item.groupSize} traveler${item.groupSize > 1 ? 's' : ''}`,
    kind: 'Trip',
  }));

  const eventItems = events.map((event) => ({
    id: `device-${event.id}`,
    date: event.start,
    title: event.title,
    subtitle: `${formatShortDate(event.start)} - ${event.calendarTitle}${event.location ? ` - ${event.location}` : ''}`,
    kind: 'Calendar',
  }));

  return [...tripItems, ...eventItems].sort(
    (left, right) => parseISO(left.date).getTime() - parseISO(right.date).getTime(),
  );
}

function isTravelCalendarEvent(event: DeviceCalendarEvent) {
  const source = `${event.title} ${event.location ?? ''} ${event.notes ?? ''}`.toLowerCase();
  return ['flight', 'airport', 'hotel', 'train', 'trip', 'travel', 'check-in', 'boarding'].some(
    (keyword) => source.includes(keyword),
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroEyebrow: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    letterSpacing: -0.9,
  },
  heroCaption: {
    marginTop: 6,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  metrics: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  metricValue: {
    marginTop: 4,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  sectionCaption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  summaryList: {
    gap: 10,
  },
  summaryRow: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryBody: {
    flex: 1,
  },
  summaryTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  summaryMeta: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  emptyText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
});
