import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedMenuButton } from '@/components/navigation/animated-menu-button';
import { BookedDestinationCard } from '@/components/planner/booked-destination-card';
import { BookingAssistantCard } from '@/components/planner/booking-assistant-card';
import { CheckInCard } from '@/components/planner/check-in-card';
import { ChecklistCard } from '@/components/planner/checklist-card';
import { DestinationHeroCard } from '@/components/planner/destination-hero-card';
import { GroupReadinessCard } from '@/components/planner/group-readiness-card';
import { InfoListCard } from '@/components/planner/info-list-card';
import { ItinerarySuggestionsCard } from '@/components/planner/itinerary-suggestions-card';
import { JourneyBridgeCard } from '@/components/planner/journey-bridge-card';
import { LocationSyncCard } from '@/components/planner/location-sync-card';
import { SmartScheduleCard } from '@/components/planner/smart-schedule-card';
import { TransportConnectionsCard } from '@/components/planner/transport-connections-card';
import { SectionCard } from '@/components/ui/section-card';
import { ScreenShell } from '@/components/ui/screen-shell';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCurrencyContext } from '@/hooks/use-currency-context';
import { useDeviceLocation } from '@/hooks/use-device-location';
import { useTrip } from '@/hooks/use-trip';
import { useWeather } from '@/hooks/use-weather';
import { formatShortDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

export default function TripScreen() {
  const theme = useAppTheme();
  const trip = useTrip();
  const deviceLocation = useDeviceLocation();
  const currency = useCurrencyContext();
  const weather = useWeather();
  const currentLocation = deviceLocation.deviceLocation;
  const currentLocationPermission = deviceLocation.deviceLocationPermission;
  const syncingLocation = deviceLocation.loading;
  const syncCurrentLocation = deviceLocation.syncCurrentLocation;

  useEffect(() => {
    if (
      !currentLocation &&
      currentLocationPermission !== 'denied' &&
      currentLocationPermission !== 'unavailable' &&
      !syncingLocation
    ) {
      void syncCurrentLocation();
    }
  }, [
    currentLocation,
    currentLocationPermission,
    syncCurrentLocation,
    syncingLocation,
  ]);

  return (
    <ScreenShell
      title="Trip Mode"
      subtitle={
        trip.activeTrip
          ? `${trip.activeTrip.assistantSummary} This page now builds the trip around the place itself, not just bookings.`
          : 'Build a trip from live destination data. The app will detect your current country from phone location.'
      }
      rightAction={
        <AnimatedMenuButton
          actions={[
            {
              id: 'location',
              label: 'Sync location',
              icon: 'crosshairs-gps',
              onPress: () => void syncCurrentLocation(),
            },
            {
              id: 'map',
              label: 'Map itinerary',
              icon: 'map-marker-path',
              onPress: () => router.push('/map-itinerary'),
            },
            {
              id: 'booked',
              label: 'Booked destinations',
              icon: 'ticket-confirmation-outline',
              onPress: () => router.push('/booked-destinations' as never),
            },
            {
              id: 'toggle',
              label: 'Toggle trip mode',
              icon: trip.tripModeEnabled ? 'toggle-switch' : 'toggle-switch-off-outline',
              onPress: () => trip.toggleTripMode(),
            },
          ]}
        />
      }>
      <BookingAssistantCard
        activeTrip={trip.activeTrip}
        origin={currentLocation}
        onTripReady={({ trip: nextTrip, budgetEntries }) => {
          trip.saveTrip(nextTrip);
          trip.replaceBudgetEntriesForTrip(nextTrip.id, budgetEntries);
        }}
      />

      <LocationSyncCard
        permission={currentLocationPermission}
        location={currentLocation}
        loading={syncingLocation}
        mapsUrl={deviceLocation.deviceLocationMapsUrl}
        onSync={() => void syncCurrentLocation()}
      />

      <JourneyBridgeCard
        trip={trip.activeTrip}
        instruction={
          trip.activeTrip
            ? 'Trip sets the route, Calendar verifies the timing, Budget tracks the local currency, and Home summarizes the whole plan.'
            : 'Grant location first, then create a trip. The other tabs will automatically inherit the active route, budget, and reminders.'
        }
      />

      {trip.activeTrip ? (
        <>
          <DestinationHeroCard trip={trip.activeTrip} weather={weather.weather} />

          <SectionCard variant="accent">
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
              {trip.activeTrip.title}
            </Text>
            <Text style={[styles.heroCaption, { color: theme.colors.textMuted }]}>
              {formatShortDate(trip.activeTrip.startDate)} to {formatShortDate(trip.activeTrip.endDate)}
              {' - '}
              {trip.activeTrip.groupSize} traveler{trip.activeTrip.groupSize > 1 ? 's' : ''}
            </Text>
            <Text style={[styles.heroBody, { color: theme.colors.text }]}>
              {trip.activeTrip.vibe}
            </Text>
            <View style={styles.routeMeta}>
              <MetaPill label={`From ${trip.activeTrip.homeBase.name}`} />
              <MetaPill
                label={`Current country ${currentLocation?.country ?? trip.activeTrip.originCountry ?? 'Unknown'}`}
              />
              <MetaPill label={`To ${trip.activeTrip.destination.name}`} />
              <MetaPill label={`Budget ${currency.currency}`} />
            </View>
          </SectionCard>

          <TransportConnectionsCard
            currentCountry={currentLocation?.country ?? trip.activeTrip.originCountry}
            destinationCountry={trip.activeTrip.destinationCountry}
            connections={trip.activeTrip.transportConnections}
            hubs={trip.activeTrip.transportHubs}
            currencyCode={currency.currency}
            currencyLocale={currency.locale}
          />

          {trip.activeTrip.confirmedBooking ? (
            <BookedDestinationCard trip={trip.activeTrip} />
          ) : null}

          <SmartScheduleCard events={trip.smartScheduleBlocks} />

          <InfoListCard
            title="AI time optimization"
            caption="These suggestions are local heuristics built from weather, crowd timing assumptions, and transport constraints."
            items={trip.optimizationInsights}
            variant="secondary"
          />

          <ItinerarySuggestionsCard
            suggestions={trip.activeTrip.suggestions}
            currencyCode={currency.currency}
            currencyLocale={currency.locale}
          />

          {trip.budgetPulse ? (
            <SectionCard>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Budget pulse</Text>
              <Text style={[styles.sectionCaption, { color: theme.colors.textMuted }]}>
                Daily guide: about {formatCurrency(trip.budgetPulse.allocatedPerDay, {
                  currency: currency.currency,
                  locale: currency.locale,
                })} per day. {trip.budgetPulse.note}
              </Text>
              <View style={styles.budgetRow}>
                <MetricChip
                  label="Spent"
                  value={formatCurrency(trip.budgetPulse.spent, {
                    currency: currency.currency,
                    locale: currency.locale,
                  })}
                />
                <MetricChip
                  label="Left"
                  value={formatCurrency(trip.budgetPulse.remaining, {
                    currency: currency.currency,
                    locale: currency.locale,
                  })}
                />
                <MetricChip
                  label="Used"
                  value={`${Math.round(trip.budgetPulse.ratio * 100)}%`}
                />
              </View>
            </SectionCard>
          ) : null}

          <CheckInCard
            value={trip.activeTrip.checkIn}
            onChange={(field, value) => trip.updateCheckInField(trip.activeTrip!.id, field, value)}
          />

          <InfoListCard
            title="Local reminders"
            caption="These reminders make the app useful before and during the trip, not just after booking."
            items={trip.reminders}
          />

          <ChecklistCard
            tasks={trip.activeTrip.checklist}
            onToggle={(taskId) => trip.toggleChecklistTask(trip.activeTrip!.id, taskId)}
          />

          <GroupReadinessCard
            readiness={trip.readiness}
            participants={trip.activeTrip.participants}
            onAdjust={(participantId, next) =>
              trip.setParticipantsReadiness(trip.activeTrip!.id, participantId, next)
            }
          />

          <SectionCard>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Micro logistics</Text>
            <Text style={[styles.sectionCaption, { color: theme.colors.textMuted }]}>
              These reminders are generated from the active route and can be checked against Calendar next.
            </Text>
            <View style={styles.logisticsList}>
              {trip.microLogistics.map((item) => (
                <View
                  key={item.label}
                  style={[styles.logisticsRow, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <Text style={[styles.logisticsLabel, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.logisticsNote, { color: theme.colors.textMuted }]}>
                    {item.note}
                  </Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <InfoListCard
            title="Offline travel kit"
            caption="The travel essentials you should keep available even when the network drops."
            items={trip.offlineSupportItems}
            variant="secondary"
          />

          <InfoListCard
            title="Memory timeline prompts"
            caption="A light post-trip layer so the app helps you remember, not just schedule."
            items={trip.memoryPrompts}
          />
        </>
      ) : null}
    </ScreenShell>
  );
}

function MetaPill({ label }: { label: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.metaPill, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.metaPillLabel, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.metricChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 24,
    letterSpacing: -0.9,
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  heroBody: {
    marginTop: 14,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 22,
  },
  routeMeta: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaPillLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  sectionCaption: {
    marginBottom: 12,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  budgetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricChip: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
  },
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },
  metricValue: {
    marginTop: 4,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  logisticsList: {
    gap: 10,
  },
  logisticsRow: {
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  logisticsLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  logisticsNote: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
});
