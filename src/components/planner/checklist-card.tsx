import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ChecklistTask } from '@/types/domain';

interface ChecklistCardProps {
  tasks: ChecklistTask[];
  onToggle: (taskId: string) => void;
}

export function ChecklistCard({ tasks, onToggle }: ChecklistCardProps) {
  const theme = useAppTheme();
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <SectionCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Departure checklist</Text>
        <Text style={[styles.count, { color: theme.colors.textMuted }]}>
          {completed}/{tasks.length}
        </Text>
      </View>
      <View style={styles.list}>
        {tasks.map((task) => (
          <PlannerPressable key={task.id} onPress={() => onToggle(task.id)}>
            <View
              style={[
                styles.row,
                {
                  backgroundColor: task.completed
                    ? theme.colors.accentSoft
                    : theme.colors.backgroundSecondary,
                },
              ]}>
              <MaterialCommunityIcons
                name={task.completed ? 'check-circle' : 'circle-outline'}
                size={22}
                color={task.completed ? theme.colors.success : theme.colors.textMuted}
              />
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{task.title}</Text>
                <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>
                  {task.points} pts · {task.category}
                </Text>
              </View>
            </View>
          </PlannerPressable>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  count: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  row: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
});
