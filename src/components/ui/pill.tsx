import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

interface PillProps {
  label: string;
  tone?: 'default' | 'accent' | 'secondary' | 'dark';
  icon?: ReactNode;
}

export function Pill({ label, tone = 'default', icon }: PillProps) {
  const theme = useAppTheme();
  const isDarkTone = tone === 'dark';
  const backgroundColor =
    tone === 'accent'
      ? theme.colors.accent
      : tone === 'secondary'
        ? theme.colors.accentSecondarySoft
        : isDarkTone
          ? theme.colors.surfaceStrong
          : theme.colors.backgroundSecondary;

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      {icon}
      <Text
        style={[
          styles.label,
          {
            color: isDarkTone ? '#FFFFFF' : theme.colors.text,
          },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
});
