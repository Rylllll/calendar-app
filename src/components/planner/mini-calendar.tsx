import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { Pill } from '@/components/ui/pill';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatDayNumber, formatShortDate, formatWeekday } from '@/utils/date';

interface MiniCalendarProps {
  days: string[];
  selectedDate: string;
  onSelect: (value: string) => void;
}

export function MiniCalendar({ days, selectedDate, onSelect }: MiniCalendarProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Pill label={formatShortDate(selectedDate)} />
      <View style={styles.grid}>
        {days.map((day) => {
          const selected = day === selectedDate;
          return (
            <PlannerPressable key={day} onPress={() => onSelect(day)} style={styles.cellWrap}>
              <View style={styles.weekdayBlock}>
                <Text style={[styles.weekday, { color: theme.colors.textMuted }]}>
                  {formatWeekday(day).slice(0, 1)}
                </Text>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: selected
                        ? theme.colors.surfaceStrong
                        : theme.colors.backgroundSecondary,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.dayLabel,
                      {
                        color: selected ? '#FFFFFF' : theme.colors.text,
                      },
                    ]}>
                    {formatDayNumber(day)}
                  </Text>
                </View>
              </View>
            </PlannerPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cellWrap: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayBlock: {
    alignItems: 'center',
    gap: 10,
  },
  weekday: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});
