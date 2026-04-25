import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PlannerPressable } from '@/components/ui/planner-pressable';
import { useAppTheme } from '@/hooks/use-app-theme';

interface MenuAction {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}

interface AnimatedMenuButtonProps {
  actions: MenuAction[];
}

const BUTTON_SIZE = 46;
const PANEL_GAP = 10;
const PANEL_PADDING = 10;
const TRIGGER_SIZE = 52;
const PANEL_COLUMNS = 2;

export function AnimatedMenuButton({ actions }: AnimatedMenuButtonProps) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    progress.value = withSpring(next ? 1 : 0, {
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    });
  };

  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [-8, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.86, 1]) },
    ],
  }));

  const triggerIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            top: TRIGGER_SIZE + 12,
          },
          panelStyle,
        ]}>
        <View style={styles.grid}>
          {actions.map((action, index) => (
            <MenuActionButton
              key={action.id}
              action={action}
              index={index}
              progress={progress}
              onPress={() => {
                setOpen(false);
                progress.value = withSpring(0, {
                  damping: 18,
                  stiffness: 220,
                  mass: 0.9,
                });
                action.onPress();
              }}
            />
          ))}
        </View>
      </Animated.View>

      <PlannerPressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close menu' : 'Open menu'}
        onPress={toggle}
        style={styles.trigger}>
        <View
          style={[
            styles.triggerBubble,
            {
              backgroundColor: theme.colors.surfaceStrong,
              shadowColor: theme.colors.shadow,
            },
          ]}>
          <Animated.View style={triggerIconStyle}>
            <MaterialCommunityIcons
              name={open ? 'close' : 'dots-grid'}
              size={22}
              color="#FFFFFF"
            />
          </Animated.View>
        </View>
      </PlannerPressable>
    </View>
  );
}

function MenuActionButton({
  action,
  index,
  progress,
  onPress,
}: {
  action: MenuAction;
  index: number;
  progress: SharedValue<number>;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const start = index * 0.08;
    const localProgress = interpolate(progress.value, [start, 1], [0, 1], 'clamp');

    return {
      opacity: localProgress,
      transform: [
        { translateY: interpolate(localProgress, [0, 1], [10, 0]) },
        { scale: interpolate(localProgress, [0, 1], [0.82, 1]) },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <PlannerPressable
        accessibilityRole="button"
        accessibilityLabel={action.label}
        onPress={onPress}
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
          },
        ]}>
        <MaterialCommunityIcons name={action.icon} size={20} color={theme.colors.text} />
      </PlannerPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: TRIGGER_SIZE,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  panel: {
    position: 'absolute',
    right: 0,
    borderWidth: 1,
    borderRadius: 18,
    padding: PANEL_PADDING,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 6,
    zIndex: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: BUTTON_SIZE * PANEL_COLUMNS + PANEL_GAP * (PANEL_COLUMNS - 1),
    gap: PANEL_GAP,
  },
  actionButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    width: TRIGGER_SIZE,
    height: TRIGGER_SIZE,
    zIndex: 3,
  },
  triggerBubble: {
    width: TRIGGER_SIZE,
    height: TRIGGER_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 5,
  },
});
