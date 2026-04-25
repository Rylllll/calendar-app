import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';
import { ItineraryStop } from '@/types/domain';
import { buildTimelineProgress } from '@/services/travel-heuristics';
import { clamp } from '@/utils/math';

interface TimelineScrubberProps {
  stops: ItineraryStop[];
  selectedStopId: string;
  onSelect: (stopId: string) => void;
}

export function TimelineScrubber({
  stops,
  selectedStopId,
  onSelect,
}: TimelineScrubberProps) {
  const theme = useAppTheme();
  const trackWidth = useSharedValue(1);
  const progress = useSharedValue(buildTimelineProgress(stops, selectedStopId));

  useEffect(() => {
    progress.value = buildTimelineProgress(stops, selectedStopId);
  }, [progress, selectedStopId, stops]);

  const gesture = Gesture.Pan().onUpdate((event) => {
    const ratio = clamp(event.x / Math.max(trackWidth.value, 1), 0, 1);
    const index = Math.round(ratio * Math.max(stops.length - 1, 1));
    const stop = stops[index];
    if (stop && stop.id !== selectedStopId) {
      runOnJS(onSelect)(stop.id);
    }
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * Math.max(trackWidth.value - 18, 0) }],
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text }]}>Scrub the day</Text>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(event: LayoutChangeEvent) => {
            trackWidth.value = event.nativeEvent.layout.width;
          }}
          style={[
            styles.track,
            {
              backgroundColor: theme.colors.backgroundSecondary,
            },
          ]}>
          <View
            style={[
              styles.fill,
              {
                width: `${buildTimelineProgress(stops, selectedStopId) * 100}%`,
                backgroundColor: theme.colors.accent,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.surfaceStrong,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
      <View style={styles.labels}>
        {stops.map((stop) => (
          <Text
            key={stop.id}
            style={[
              styles.stopLabel,
              {
                color:
                  stop.id === selectedStopId ? theme.colors.text : theme.colors.textMuted,
              },
            ]}>
            {stop.title}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  track: {
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  stopLabel: {
    flex: 1,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    textAlign: 'center',
  },
});
