import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = 'default' | 'accent' | 'secondary' | 'dark';

interface SectionCardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  variant?: Variant;
}

export function SectionCard({
  children,
  style,
  variant = 'default',
}: SectionCardProps) {
  const theme = useAppTheme();

  const backgroundColor =
    variant === 'accent'
      ? theme.colors.accentSoft
      : variant === 'secondary'
        ? theme.colors.accentSecondarySoft
        : variant === 'dark'
          ? theme.colors.surfaceStrong
          : theme.colors.surface;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: variant === 'dark' ? 'transparent' : theme.colors.border,
          shadowColor: theme.colors.shadow,
        },
        style,
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 30,
    elevation: 3,
  },
});
