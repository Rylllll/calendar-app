import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';

const iconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  index: 'view-dashboard-outline',
  calendar: 'calendar-month-outline',
  trip: 'map-marker-path',
  budget: 'wallet-travel',
  settings: 'tune-variant',
};

// 1. Extract to a separate component to safely use Reanimated hooks
function TabItem({ route, isFocused, onPress, theme }: any) {
  // 2. Create a spring animation for the icon scale
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isFocused ? 1.15 : 1, {
            damping: 12,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Animated.View
        layout={LinearTransition.springify().damping(18)}
        style={[
          styles.inner,
          isFocused && {
            backgroundColor: theme.colors.tabActive,
            paddingHorizontal: 14, 
            minWidth: 44,
          },
        ]}>
        
        {/* 3. Wrap the icon in the animated style */}
        <Animated.View style={animatedIconStyle}>
          <MaterialCommunityIcons
            name={iconMap[route.name as keyof typeof iconMap] ?? 'circle-outline'}
            size={22}
            color={isFocused ? '#171717' : '#B8B8B8'}
          />
        </Animated.View>
        {isFocused ? <View style={styles.focusDot} /> : null}
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.tabBar, { backgroundColor: theme.colors.tabBar }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
  
          if ((options as any).href === null) {
            return null;
          }

          const isFocused = state.index === index;

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              theme={theme}
              onPress={() => navigation.navigate(route.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 0,
  },
  tabBar: {
    minHeight: 72,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 22,
    minWidth: 44,
  },
  focusDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#171717',
  },
});