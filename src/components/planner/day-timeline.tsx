import { parseISO } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Pill } from '@/components/ui/pill';
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
          const selected = selectedEventId === event.id;

          return (
            <Animated.View
              entering={FadeInDown.delay(index * 28).springify()}
              layout={LinearTransition.springify().damping(18)}
              key={event.id}
              style={styles.row}>
              <View style={styles.timeColumn}>
                <Text style={[styles.time, { color: theme.colors.textMuted }]}>
                  {formatTimeline(event.start)}
                </Text>
                <View
                  style={[
                    styles.timeDot,
                    { backgroundColor: getAccentColor(event.category, theme.colors) },
                  ]}
                />
              </View>

              <PlannerPressable
                haptic={!!onEventPress}
                onPress={onEventPress ? () => onEventPress(event) : undefined}
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selected ? theme.colors.accentSecondary : theme.colors.border,
                  },
                ]}>
                <View style={styles.cardHeader}>
                  <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {event.title}
                  </Text>
                  <Pill label={formatEventCategory(event)} tone={event.source === 'device' ? 'secondary' : 'dark'} />
                </View>

                <Text numberOfLines={1} style={[styles.cardMeta, { color: theme.colors.textMuted }]}>
                  {formatTimeline(event.start)} - {formatTimeline(event.end)}
                  {event.sourceCalendarTitle ? ` - ${event.sourceCalendarTitle}` : ''}
                </Text>

                {event.description || event.location?.name ? (
                  <Text numberOfLines={1} style={[styles.cardHint, { color: theme.colors.textMuted }]}>
                    {event.location?.name ?? event.description}
                  </Text>
                ) : null}
              </PlannerPressable>
            </Animated.View>
          );
        })}
      </View>
    </SectionCard>
  );
}

function getAccentColor(
  category: PlannerEvent['category'],
  colors: {
    accent: string;
    accentSecondary: string;
    textMuted: string;
    surfaceStrong: string;
  },
) {
  if (category === 'travel') {
    return colors.accent;
  }
  if (category === 'prep') {
    return colors.accentSecondary;
  }
  if (category === 'budget') {
    return '#10b981';
  }
  if (category === 'wellness') {
    return '#f59e0b';
  }
  if (category === 'synced') {
    return colors.textMuted;
  }
  return colors.surfaceStrong;
}

function formatEventCategory(event: PlannerEvent) {
  if (event.source === 'device') {
    return 'Phone';
  }

  if (event.category === 'travel') {
    return 'Travel';
  }
  if (event.category === 'prep') {
    return 'Prep';
  }
  if (event.category === 'budget') {
    return 'Budget';
  }
  if (event.category === 'booking') {
    return 'Booking';
  }
  if (event.category === 'wellness') {
    return 'Wellness';
  }

  return 'Plan';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  timeColumn: {
    width: 56,
    alignItems: 'flex-start',
    paddingTop: 10,
    gap: 6,
  },
  time: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  timeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  cardMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  cardHint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },
});
