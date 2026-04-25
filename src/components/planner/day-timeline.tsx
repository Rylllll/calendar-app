import { parseISO } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PlannerEvent } from '@/types/domain';
import { formatTimeline } from '@/utils/date';

interface DayTimelineProps {
  events: PlannerEvent[];
  title?: string;
  selectedEventId?: string | null;
  onEventPress?: (event: PlannerEvent) => void;
}

export function DayTimeline({
  events,
  title = 'Daily flow',
  selectedEventId,
  onEventPress,
}: DayTimelineProps) {
  const theme = useAppTheme();
  const sortedEvents = [...events].sort(
    (left, right) => parseISO(left.start).getTime() - parseISO(right.start).getTime(),
  );

  return (
    <SectionCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
          {sortedEvents.length} blocks
        </Text>
      </View>
      <View style={styles.column}>
        {sortedEvents.map((event, index) => {
          const background =
            event.category === 'travel'
              ? theme.colors.accent
              : event.category === 'prep'
                ? theme.colors.accentSecondarySoft
                : event.category === 'synced'
                  ? theme.colors.backgroundSecondary
                  : event.category === 'budget'
                    ? theme.colors.surfaceStrong
                    : theme.colors.surface;
          const textColor = event.category === 'budget' ? '#FFFFFF' : theme.colors.text;
          const selected = selectedEventId === event.id;

          return (
            <Animated.View
              entering={FadeInDown.delay(index * 35).springify()}
              layout={LinearTransition.springify().damping(18)}
              key={event.id}
              style={styles.row}>
              <Text style={[styles.time, { color: theme.colors.textMuted }]}>
                {formatTimeline(event.start)}
              </Text>
              <PlannerPressable
                haptic={!!onEventPress}
                onPress={onEventPress ? () => onEventPress(event) : undefined}
                style={[
                  styles.block,
                  {
                    backgroundColor: background,
                    borderColor: selected ? theme.colors.accentSecondary : 'transparent',
                    borderWidth: selected ? 1 : 0,
                  },
                ]}>
                <View style={[styles.marker, { backgroundColor: theme.colors.surfaceStrong }]}>
                  <Text style={styles.markerLabel}>{index + 1}</Text>
                </View>
                <View style={styles.blockBody}>
                  <Text style={[styles.blockTitle, { color: textColor }]}>{event.title}</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.blockCaption,
                      { color: event.category === 'budget' ? '#E6E6E6' : theme.colors.textMuted },
                    ]}>
                    {formatTimeline(event.start)} - {formatTimeline(event.end)}
                    {event.sourceCalendarTitle ? ` - ${event.sourceCalendarTitle}` : ''}
                  </Text>
                </View>
                {event.source === 'device' ? (
                  <View style={[styles.sourceBadge, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.sourceBadgeText, { color: theme.colors.text }]}>Phone</Text>
                  </View>
                ) : null}
              </PlannerPressable>
            </Animated.View>
          );
        })}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  column: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  time: {
    width: 68,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  block: {
    flex: 1,
    minHeight: 62,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 12,
  },
  marker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  blockBody: {
    flex: 1,
    gap: 3,
  },
  blockTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  blockCaption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  sourceBadgeText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
  },
});
