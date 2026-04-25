import { formatDistanceToNow } from 'date-fns';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { Pill } from '@/components/ui/pill';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  DeviceLocationPermission,
  DeviceLocationSnapshot,
} from '@/types/domain';

interface LocationSyncCardProps {
  permission: DeviceLocationPermission;
  location: DeviceLocationSnapshot | null;
  loading: boolean;
  mapsUrl: string | null;
  onSync: () => void;
}

export function LocationSyncCard({
  permission,
  location,
  loading,
  mapsUrl,
  onSync,
}: LocationSyncCardProps) {
  const theme = useAppTheme();

  const statusCopy =
    permission === 'granted'
      ? location
        ? `${location.label} is your current phone location in ${location.country ?? 'your current country'}.`
        : 'Location permission is ready. Refresh to pin the current position.'
      : permission === 'denied'
        ? 'Location access is blocked. Enable it to route trips from your current area.'
        : permission === 'unavailable'
          ? 'Live location sync runs on iOS and Android, not on web.'
          : 'Use your phone location to anchor trips and route suggestions.';

  return (
    <SectionCard>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Phone location</Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{statusCopy}</Text>
        </View>
        <PlannerPressable
          onPress={onSync}
          style={[
            styles.iconButton,
            {
              backgroundColor: loading ? theme.colors.backgroundSecondary : theme.colors.surfaceStrong,
            },
          ]}>
          <MaterialCommunityIcons
            name={loading ? 'loading' : 'crosshairs-gps'}
            size={18}
            color={loading ? theme.colors.text : '#FFFFFF'}
          />
        </PlannerPressable>
      </View>

      <View style={styles.metaRow}>
        <Pill label={permission === 'granted' ? 'Live' : permission} tone="dark" />
        <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
          {location
            ? `Updated ${formatDistanceToNow(new Date(location.fetchedAt), { addSuffix: true })}`
            : 'No synced position yet'}
        </Text>
      </View>

      {location ? (
        <View style={[styles.locationCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
          <Text style={[styles.locationTitle, { color: theme.colors.text }]}>{location.label}</Text>
          <Text style={[styles.locationCaption, { color: theme.colors.textMuted }]}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        </View>
      ) : null}

      {mapsUrl ? (
        <PlannerPressable
          onPress={() => {
            Linking.openURL(mapsUrl).catch(() => undefined);
          }}
          style={[styles.mapsButton, { backgroundColor: theme.colors.accentSoft }]}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={18} color={theme.colors.text} />
          <Text style={[styles.mapsButtonLabel, { color: theme.colors.text }]}>Open in maps</Text>
        </PlannerPressable>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  headerBody: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  locationCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  locationTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
  },
  locationCaption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  mapsButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapsButtonLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
