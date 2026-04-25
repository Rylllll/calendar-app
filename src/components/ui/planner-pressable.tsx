import * as Haptics from 'expo-haptics';
import { PropsWithChildren } from 'react';
import {
  AccessibilityRole,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PlannerPressableProps extends PropsWithChildren {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

export function PlannerPressable({
  children,
  onPress,
  style,
  disabled,
  haptic = true,
  accessibilityLabel,
  accessibilityRole,
}: PlannerPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      onPress={() => {
        if (haptic) {
          Haptics.selectionAsync().catch(() => undefined);
        }
        onPress?.();
      }}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
