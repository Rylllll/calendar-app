import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Participant } from '@/types/domain';

interface GroupReadinessCardProps {
  readiness: number;
  participants: Participant[];
  onAdjust: (participantId: string, nextReadiness: number) => void;
}

export function GroupReadinessCard({
  readiness,
  participants,
  onAdjust,
}: GroupReadinessCardProps) {
  const theme = useAppTheme();
  return (
    <SectionCard>
      <Text style={[styles.title, { color: theme.colors.text }]}>Group readiness</Text>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.backgroundSecondary },
        ]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${readiness}%`,
              backgroundColor: theme.colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.score, { color: theme.colors.text }]}>{readiness}% aligned</Text>
      <View style={styles.participants}>
        {participants.map((participant) => (
          <View
            key={participant.id}
            style={[
              styles.person,
              { backgroundColor: theme.colors.backgroundSecondary },
            ]}>
            <View style={[styles.avatar, { backgroundColor: participant.color }]} />
            <View style={styles.personBody}>
              <Text style={[styles.personName, { color: theme.colors.text }]}>{participant.name}</Text>
              <Text style={[styles.personRole, { color: theme.colors.textMuted }]}>
                {participant.role} · {participant.readiness}%
              </Text>
            </View>
            <View style={styles.stepper}>
              <PlannerPressable
                onPress={() => onAdjust(participant.id, Math.max(0, participant.readiness - 10))}>
                <MaterialCommunityIcons name="minus-circle-outline" size={20} color={theme.colors.textMuted} />
              </PlannerPressable>
              <PlannerPressable
                onPress={() => onAdjust(participant.id, Math.min(100, participant.readiness + 10))}>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.text} />
              </PlannerPressable>
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
    marginBottom: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  score: {
    marginTop: 10,
    marginBottom: 14,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  participants: {
    gap: 10,
  },
  person: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  personBody: {
    flex: 1,
  },
  personName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  personRole: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  stepper: {
    flexDirection: 'row',
    gap: 10,
  },
});
