import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Trip, WeatherSnapshot } from '@/types/domain';

interface DestinationHeroCardProps {
  trip: Trip;
  weather?: WeatherSnapshot;
}

export function DestinationHeroCard({
  trip,
  weather,
}: DestinationHeroCardProps) {
  const theme = useAppTheme();

  return (
    <SectionCard style={styles.card}>
      <View style={styles.imageWrap}>
        {trip.destinationImageUrl ? (
          <Image
            source={{ uri: trip.destinationImageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[theme.colors.accentSecondarySoft, theme.colors.accentSoft]}
            style={styles.image}
          />
        )}
        <LinearGradient
          colors={['rgba(12,12,12,0.02)', 'rgba(12,12,12,0.7)']}
          style={styles.overlay}
        />
        <View style={styles.topBadges}>
          <Pill label={trip.destinationCountry ?? trip.destination.name} tone="secondary" />
          {weather ? (
            <Pill label={`${weather.temperature}° ${weather.condition}`} tone="dark" />
          ) : (
            <Pill label="Live destination view" tone="dark" />
          )}
        </View>
        <View style={styles.bottomCopy}>
          <Text style={styles.title}>{trip.destination.name}</Text>
          <Text style={styles.caption}>
            {trip.destinationImageCaption ?? trip.destination.subtitle ?? trip.assistantSummary}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <MaterialCommunityIcons
            name="image-filter-hdr-outline"
            size={17}
            color={theme.colors.text}
          />
          <Text style={[styles.footerLabel, { color: theme.colors.text }]}>
            Destination image stays tied to the active trip so the page feels anchored to the
            place, not just the booking.
          </Text>
        </View>
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 240,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomCopy: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 28,
    letterSpacing: -1,
  },
  caption: {
    color: '#E8E8E6',
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  footerLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
});
