import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useEffect } from 'react';

interface SkeletonBlockProps {
  style: StyleProp<ViewStyle>;
}

export function SkeletonBlock({ style }: SkeletonBlockProps) {
  const theme = useAppTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 18,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}
