import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';

import { BookedDestinationCard } from '@/components/planner/booked-destination-card';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { ScreenShell } from '@/components/ui/screen-shell';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTrip } from '@/hooks/use-trip';

export default function BookedDestinationsScreen() {
  const theme = useAppTheme();
  const trip = useTrip();
  const bookedTrips = trip.trips.filter((item) => Boolean(item.confirmedBooking));

  return (
    <ScreenShell
      title="Booked Destinations"
      subtitle="Every trip you confirmed locally lives here with provider and route details."
      rightAction={
        <PlannerPressable
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceStrong }]}
          onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
        </PlannerPressable>
      }>
      {bookedTrips.length ? (
        bookedTrips.map((bookedTrip) => (
          <BookedDestinationCard key={bookedTrip.id} trip={bookedTrip} />
        ))
      ) : (
        <SectionCard variant="accent">
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No confirmed destination yet
          </Text>
          <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>
            Use the auto-booking assistant in Trip Mode, review the draft, then confirm it. The
            trip will appear here once saved.
          </Text>
        </SectionCard>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  emptyBody: {
    marginTop: 8,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
});
