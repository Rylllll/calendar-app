import { Switch, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { ScreenShell } from '@/components/ui/screen-shell';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { usePlanner } from '@/hooks/use-planner';
import { accentThemeMeta } from '@/theme';

export default function SettingsScreen() {
  const theme = useAppTheme();
  const planner = usePlanner();

  return (
    <ScreenShell title="Settings" subtitle="Appearance, offline behavior, and travel mode controls.">
      <SectionCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>Modes</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Trip mode</Text>
          <Switch value={planner.tripModeEnabled} onValueChange={planner.toggleTripMode} />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Dark mode preference</Text>
          <View style={styles.modeButtons}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <PlannerPressable key={mode} onPress={() => planner.setThemePreference(mode)}>
                <Pill
                  label={mode}
                  tone={planner.themePreference === mode ? 'dark' : 'default'}
                />
              </PlannerPressable>
            ))}
          </View>
        </View>
      </SectionCard>
      <SectionCard>
        <Text style={[styles.title, { color: theme.colors.text }]}>Reward themes</Text>
        <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
          Complete trip tasks and maintain streaks to unlock interface variants.
        </Text>
        <View style={styles.themeList}>
          {accentThemeMeta.map((accent) => {
            const unlocked = planner.unlockedThemes.includes(accent.key);
            const active = planner.activeAccentTheme === accent.key;
            return (
              <PlannerPressable
                key={accent.key}
                disabled={!unlocked}
                onPress={() => planner.setAccentTheme(accent.key)}>
                <View
                  style={[
                    styles.themeRow,
                    {
                      backgroundColor: active
                        ? theme.colors.accentSoft
                        : theme.colors.backgroundSecondary,
                      opacity: unlocked ? 1 : 0.5,
                    },
                  ]}>
                  <View style={styles.themeBody}>
                    <Text style={[styles.themeLabel, { color: theme.colors.text }]}>{accent.label}</Text>
                    <Text style={[styles.themeMeta, { color: theme.colors.textMuted }]}>
                      {unlocked ? 'Unlocked' : `Locked · ${accent.unlockLabel}`}
                    </Text>
                  </View>
                  {active ? <Pill label="Active" tone="dark" /> : null}
                </View>
              </PlannerPressable>
            );
          })}
        </View>
      </SectionCard>
      <SectionCard variant="accent">
        <Text style={[styles.title, { color: theme.colors.text }]}>Offline-first notes</Text>
        <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
          Events, checklists, booking preferences, QR payloads, budget entries, and rewards all persist
          locally with Zustand + AsyncStorage. Weather enhances the UI when available and gracefully falls
          back to cached state when offline.
        </Text>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    marginBottom: 10,
  },
  row: {
    gap: 12,
    marginTop: 8,
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  themeList: {
    gap: 10,
    marginTop: 14,
  },
  themeRow: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  themeBody: {
    flex: 1,
  },
  themeLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  themeMeta: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
});
