import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { Pill } from '@/components/ui/pill';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  DeviceCalendarPermission,
  DeviceCalendarSource,
} from '@/types/domain';

interface DeviceCalendarSyncCardProps {
  permission: DeviceCalendarPermission;
  calendars: DeviceCalendarSource[];
  eventsCount: number;
  loading: boolean;
  lastSyncedAt: string | null;
  onSync: () => void;
}

export function DeviceCalendarSyncCard({
  permission,
  calendars,
  eventsCount,
  loading,
  lastSyncedAt,
  onSync,
}: DeviceCalendarSyncCardProps) {
  const theme = useAppTheme();
  const syncedLabel = lastSyncedAt
    ? `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
    : 'Not synced yet';

  const statusCopy =
    permission === 'granted'
      ? `${eventsCount} phone events ready across ${calendars.length} calendars`
      : permission === 'denied'
        ? 'Calendar access is blocked. Grant permission to bring your phone schedule in.'
        : permission === 'unavailable'
          ? 'Phone calendar sync works on iOS and Android, not on web previews.'
          : 'Bring your device calendar into Voyagr and merge it with your planner.';

  return (
    <SectionCard variant="accent" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headingWrap}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Phone calendar sync</Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{statusCopy}</Text>
        </View>
        <PlannerPressable
          onPress={onSync}
          style={[
            styles.syncButton,
            {
              backgroundColor: loading ? theme.colors.surface : theme.colors.surfaceStrong,
            },
          ]}>
          <MaterialCommunityIcons
            name={loading ? 'loading' : 'calendar-sync-outline'}
            size={20}
            color={loading ? theme.colors.text : '#FFFFFF'}
          />
        </PlannerPressable>
      </View>
      <View style={styles.metaRow}>
        <Pill label={permission === 'granted' ? 'Connected' : permission} tone="dark" />
        <Text style={[styles.syncedText, { color: theme.colors.textMuted }]}>{syncedLabel}</Text>
      </View>
      {calendars.length ? (
        <View style={styles.calendarRow}>
          {calendars.slice(0, 4).map((calendar) => (
            <View
              key={calendar.id}
              style={[
                styles.calendarChip,
                { backgroundColor: theme.colors.surface },
              ]}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: calendar.color || theme.colors.accentSecondary },
                ]}
              />
              <Text numberOfLines={1} style={[styles.calendarLabel, { color: theme.colors.text }]}>
                {calendar.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  headingWrap: {
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
  syncButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  syncedText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  calendarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  calendarChip: {
    minWidth: 120,
    maxWidth: '48%',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  calendarLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
});
