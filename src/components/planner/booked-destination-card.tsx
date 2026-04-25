import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Trip } from '@/types/domain';
import { formatShortDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

interface BookedDestinationCardProps {
  trip: Trip;
}

export function BookedDestinationCard({ trip }: BookedDestinationCardProps) {
  const theme = useAppTheme();
  const booking = trip.confirmedBooking;

  if (!booking) {
    return null;
  }

  return (
    <SectionCard style={styles.card}>
      {trip.destinationImageUrl ? (
        <Image source={{ uri: trip.destinationImageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.imageFallback, { backgroundColor: theme.colors.accentSoft }]} />
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerBody}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{trip.destination.name}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {formatShortDate(trip.startDate)} to {formatShortDate(trip.endDate)} - ref {booking.reference}
            </Text>
          </View>
          <Pill label="Confirmed" tone="dark" />
        </View>

        <View style={styles.infoRow}>
          <InfoItem icon="map-marker-path" label="Route" value={booking.routeLabel ?? trip.title} />
          <InfoItem icon="bed-outline" label="Stay" value={booking.stayLabel ?? trip.bookingPreference.label} />
        </View>

        <View style={styles.infoRow}>
          <InfoItem icon="domain" label="Provider" value={booking.provider} />
          <InfoItem
            icon="cash-multiple"
            label="Total"
            value={formatCurrency(booking.totalAmount, {
              currency: booking.currencyCode,
            })}
          />
        </View>

        <Text style={[styles.summary, { color: theme.colors.textMuted }]}>{booking.summary}</Text>

        <View style={styles.actions}>
          <PlannerPressable
            style={[styles.actionButton, { backgroundColor: theme.colors.backgroundSecondary }]}
            onPress={() => {
              if (booking.mapsUrl) {
                Linking.openURL(booking.mapsUrl).catch(() => undefined);
              }
            }}>
            <MaterialCommunityIcons name="map-search-outline" size={16} color={theme.colors.text} />
            <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Map</Text>
          </PlannerPressable>
          <PlannerPressable
            style={[styles.primaryAction, { backgroundColor: theme.colors.surfaceStrong }]}
            onPress={() => {
              Linking.openURL(booking.bookingUrl).catch(() => undefined);
            }}>
            <MaterialCommunityIcons name="open-in-new" size={16} color="#FFFFFF" />
            <Text style={styles.primaryActionLabel}>Provider</Text>
          </PlannerPressable>
        </View>
      </View>
    </SectionCard>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.infoItem, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.text} />
      <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.infoValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 156,
  },
  imageFallback: {
    width: '100%',
    height: 156,
  },
  content: {
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBody: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },
  meta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoItem: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
  summary: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  primaryActionLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
