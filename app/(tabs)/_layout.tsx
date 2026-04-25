import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/navigation/floating-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // remove labels globally
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="trip" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}