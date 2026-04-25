import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/ui/section-card';
import { SkeletonBlock } from '@/components/ui/skeleton-block';
import { useAppTheme } from '@/hooks/use-app-theme';
import { WeatherSnapshot } from '@/types/domain';

interface WeatherWidgetProps {
  weather?: WeatherSnapshot;
  loading: boolean;
}

export function WeatherWidget({ weather, loading }: WeatherWidgetProps) {
  const theme = useAppTheme();

  return (
    <SectionCard variant="accent" style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Weather pulse</Text>
        <MaterialCommunityIcons name="weather-partly-cloudy" size={20} color={theme.colors.text} />
      </View>
      {loading && !weather ? (
        <View style={styles.skeletonWrap}>
          <SkeletonBlock style={{ width: 120, height: 34 }} />
          <SkeletonBlock style={{ width: '100%', height: 14 }} />
        </View>
      ) : (
        <>
          <Text style={[styles.temp, { color: theme.colors.text }]}>
            {weather?.temperature ?? '--'}°
          </Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            {weather?.condition ?? 'Offline cache waiting'} · {weather?.windSpeed ?? '--'} km/h wind
          </Text>
        </>
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  temp: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 34,
    letterSpacing: -1.2,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
  },
  skeletonWrap: {
    gap: 10,
  },
});
