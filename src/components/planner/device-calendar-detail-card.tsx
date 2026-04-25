import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { Pill } from '@/components/ui/pill';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { DeviceCalendarEvent } from '@/types/domain';

interface DeviceCalendarDetailCardProps {
  event: DeviceCalendarEvent;
  onOpenNative: (eventId: string, instanceStartDate?: string) => Promise<void>;
}

export function DeviceCalendarDetailCard({
  event,
  onOpenNative,
}: DeviceCalendarDetailCardProps) {
  const theme = useAppTheme();

  return (
    <SectionCard>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{event.title}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            {event.calendarTitle} · {format(parseISO(event.start), 'EEE, MMM d • h:mm a')}
          </Text>
        </View>
        <Pill label={event.isAllDay ? 'All day' : 'Timed'} tone="secondary" />
      </View>
      <View style={styles.metaWrap}>
        <DetailRow icon="map-marker-outline" text={event.location || 'No location'} />
        <DetailRow
          icon="calendar-clock-outline"
          text={`${format(parseISO(event.start), 'h:mm a')} - ${format(parseISO(event.end), 'h:mm a')}`}
        />
        {event.recurrenceText ? (
          <DetailRow icon="repeat" text={event.recurrenceText} />
        ) : null}
        {event.timeZone ? <DetailRow icon="earth" text={event.timeZone} /> : null}
        {event.organizer || event.organizerEmail ? (
          <DetailRow
            icon="account-circle-outline"
            text={event.organizer || event.organizerEmail || ''}
          />
        ) : null}
      </View>
      {event.notes ? (
        <View
          style={[
            styles.notesCard,
            { backgroundColor: theme.colors.backgroundSecondary },
          ]}>
          <Text style={[styles.notesLabel, { color: theme.colors.textMuted }]}>Notes</Text>
          <Text style={[styles.notesBody, { color: theme.colors.text }]}>{event.notes}</Text>
        </View>
      ) : null}
      <View style={styles.actions}>
        <PlannerPressable
          onPress={() => onOpenNative(event.id, event.start)}
          style={[styles.primaryAction, { backgroundColor: theme.colors.surfaceStrong }]}>
          <Text style={styles.primaryActionLabel}>Open in phone calendar</Text>
        </PlannerPressable>
        {event.url ? (
          <PlannerPressable
            onPress={() => {
              if (event.url) {
                Linking.openURL(event.url).catch(() => undefined);
              }
            }}
            style={[styles.secondaryAction, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="open-in-new" size={18} color={theme.colors.text} />
          </PlannerPressable>
        ) : null}
      </View>
    </SectionCard>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <MaterialCommunityIcons name={icon} size={17} color={theme.colors.textMuted} />
      <Text style={[styles.detailText, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  metaWrap: {
    marginTop: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  notesCard: {
    marginTop: 16,
    borderRadius: 20,
    padding: 14,
    gap: 8,
  },
  notesLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesBody: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  secondaryAction: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
