import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Trip } from '@/types/domain';

interface JourneyBridgeCardProps {
  trip?: Trip;
  instruction: string;
}

const shortcuts = [
  { id: 'home', label: 'Home', icon: 'view-dashboard-outline', route: '/(tabs)' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-month-outline', route: '/(tabs)/calendar' },
  { id: 'trip', label: 'Trip', icon: 'map-marker-path', route: '/(tabs)/trip' },
  { id: 'budget', label: 'Budget', icon: 'wallet-travel', route: '/(tabs)/budget' },
] as const;

export function JourneyBridgeCard({
  trip,
  instruction,
}: JourneyBridgeCardProps) {
  const theme = useAppTheme();

  return (
    <SectionCard variant="dark" style={styles.card}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.08)',
          'rgba(255,255,255,0.02)',
        ]}
        style={styles.gradient}
      />
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={styles.title}>Planner lane</Text>
          <Text style={styles.caption}>
            {trip
              ? `${trip.homeBase.name} -> ${trip.destination.name}`
              : 'Use the same active trip across planning, timing, and budget.'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.colors.accentSecondary }]}>
          <MaterialCommunityIcons name="transit-connection-variant" size={18} color="#171717" />
        </View>
      </View>

      <Text style={styles.instruction}>{instruction}</Text>

      <View style={styles.shortcutRow}>
        {shortcuts.map((shortcut) => (
          <PlannerPressable
            key={shortcut.id}
            onPress={() => router.push(shortcut.route)}
            style={[styles.shortcut, { backgroundColor: theme.colors.overlay }]}>
            <MaterialCommunityIcons name={shortcut.icon} size={18} color="#FFFFFF" />
            <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
          </PlannerPressable>
        ))}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerBody: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    color: '#D6D8DE',
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    marginTop: 14,
    color: '#FFFFFF',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
  },
  shortcutRow: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcut: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortcutLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
