import { PropsWithChildren, ReactNode, useEffect } from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';

interface ScreenShellProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ScreenShell({
  children,
  title,
  subtitle,
  rightAction,
  scrollable = true,
  contentContainerStyle,
}: ScreenShellProps) {
  const theme = useAppTheme();
  const orbOneShift = useSharedValue(0);
  const orbTwoShift = useSharedValue(0);

  useEffect(() => {
    orbOneShift.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 3400 }),
        withTiming(-6, { duration: 3400 }),
      ),
      -1,
      true,
    );
    orbTwoShift.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 3900 }),
        withTiming(8, { duration: 3900 }),
      ),
      -1,
      true,
    );
  }, [orbOneShift, orbTwoShift]);

  const orbOneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbOneShift.value }, { translateX: orbOneShift.value * -0.5 }],
  }));
  const orbTwoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbTwoShift.value }, { translateX: orbTwoShift.value * 0.4 }],
  }));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[
          theme.colors.background,
          theme.colors.background,
          theme.colors.backgroundSecondary,
        ]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            top: -80,
            right: -30,
            backgroundColor: theme.colors.accentSecondarySoft,
          },
          orbOneStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            top: 140,
            left: -90,
            backgroundColor: theme.colors.accentSoft,
          },
          orbTwoStyle,
        ]}
      />
      {scrollable ? (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
          showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
              ) : null}
            </View>
            {rightAction}
          </Animated.View>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.contentContainer, contentContainerStyle]}>
          <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
              ) : null}
            </View>
            {rightAction}
          </Animated.View>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 20,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 28,
    letterSpacing: -0.9,
  },
  subtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
  },
  orb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    opacity: 0.55,
  },
});
