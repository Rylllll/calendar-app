import { StyleSheet, Text, View } from 'react-native';

import { ItineraryStop } from '@/types/domain';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';

interface ItineraryMapProps {
  stops: ItineraryStop[];
  selectedStopId: string;
  onSelect: (stopId: string) => void;
}

export function ItineraryMap({ stops, selectedStopId, onSelect }: ItineraryMapProps) {
  const theme = useAppTheme();
  return (
    <SectionCard style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Map preview</Text>
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
        Native map view is shown on iOS and Android. Web falls back to this itinerary rail.
      </Text>
      <View style={styles.list}>
        {stops.map((stop) => (
          <View
            key={stop.id}
            onTouchEnd={() => onSelect(stop.id)}
            style={[
              styles.stop,
              {
                backgroundColor:
                  stop.id === selectedStopId
                    ? theme.colors.accentSoft
                    : theme.colors.backgroundSecondary,
              },
            ]}>
            <Text style={[styles.stopTitle, { color: theme.colors.text }]}>{stop.title}</Text>
            <Text style={[styles.stopCaption, { color: theme.colors.textMuted }]}>
              {stop.place.name}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  stop: {
    borderRadius: 18,
    padding: 14,
  },
  stopTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  stopCaption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
});
