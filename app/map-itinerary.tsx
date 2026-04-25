import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ItineraryMap } from '@/components/planner/itinerary-map';
import { TimelineScrubber } from '@/components/planner/timeline-scrubber';
import { Pill } from '@/components/ui/pill';
import { ScreenShell } from '@/components/ui/screen-shell';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTrip } from '@/hooks/use-trip';
import { summarizeTripFlow } from '@/services/travel-heuristics';
import { formatTimeline } from '@/utils/date';

export default function MapItineraryScreen() {
  const theme = useAppTheme();
  const trip = useTrip();
  const [selectedStopId, setSelectedStopId] = useState(trip.activeTrip?.itinerary[0]?.id ?? '');

  const selectedStop = useMemo(
    () => trip.activeTrip?.itinerary.find((stop) => stop.id === selectedStopId) ?? trip.activeTrip?.itinerary[0],
    [selectedStopId, trip.activeTrip],
  );

  if (!trip.activeTrip) {
    return <ScreenShell title="Map Itinerary" subtitle="No itinerary available." />;
  }

  return (
    <ScreenShell title="Map Itinerary" subtitle="A spatial timeline you can scrub through.">
      <View style={styles.pillRow}>
        <Pill label={`${summarizeTripFlow(trip.activeTrip.itinerary)} min door-to-dinner`} tone="dark" />
        <Pill label={trip.transportSuggestion} tone="secondary" />
      </View>
      <ItineraryMap
        stops={trip.activeTrip.itinerary}
        selectedStopId={selectedStopId}
        onSelect={setSelectedStopId}
      />
      <TimelineScrubber
        stops={trip.activeTrip.itinerary}
        selectedStopId={selectedStopId}
        onSelect={setSelectedStopId}
      />
      {selectedStop ? (
        <SectionCard variant="accent">
          <Text style={[styles.stopTitle, { color: theme.colors.text }]}>{selectedStop.title}</Text>
          <Text style={[styles.stopCaption, { color: theme.colors.textMuted }]}>
            {selectedStop.place.name} · {selectedStop.place.subtitle}
          </Text>
          <Text style={[styles.stopTime, { color: theme.colors.text }]}>
            {formatTimeline(selectedStop.time)}
          </Text>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stopTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
  },
  stopCaption: {
    marginTop: 4,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  stopTime: {
    marginTop: 16,
    fontFamily: 'Manrope_700Bold',
    fontSize: 26,
  },
});
