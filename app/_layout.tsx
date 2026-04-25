import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/providers/app-provider';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booked-destinations" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="map-itinerary" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </AppProvider>
  );
}
