import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/navigation/floating-tab-bar';
import { usePlanner } from '@/hooks/use-planner'; // <-- Add this import

export default function TabsLayout() {
  const { tripModeEnabled } = usePlanner(); // <-- Get the trip mode state

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen 
        name="trip" 
        options={{
          href: tripModeEnabled ? '/(tabs)/trip' : null, // <-- Conditionally hide
        }}
      />
      <Tabs.Screen 
        name="budget" 
        options={{
          href: tripModeEnabled ? '/(tabs)/budget' : null, // <-- Conditionally hide
        }}
      />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}