import { StyleSheet, Text, View } from 'react-native';

import { PlannerEvent } from '@/types/domain';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatTimeline } from '@/utils/date';

interface SmartScheduleCardProps {
  events: PlannerEvent[];
}

export function SmartScheduleCard({ events }: SmartScheduleCardProps) {
  const theme = useAppTheme();

  return (
    <SectionCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Smart daily schedule</Text>
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
        This is the full-day planner layer Klook-style booking apps usually stop short of.
      </Text>
      <View style={styles.list}>
        {events.map((event) => (
          <View
            key={event.id}
            style={[styles.row, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <Text style={[styles.time, { color: theme.colors.text }]}>{formatTimeline(event.start)}</Text>
            <View style={styles.body}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{event.title}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>
                {event.description ?? event.location?.name ?? 'Smartly placed around the route'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    marginTop: 4,
    marginBottom: 14,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    gap: 10,
  },
  row: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  time: {
    width: 62,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 3,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
});
