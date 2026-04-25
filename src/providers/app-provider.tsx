import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { usePlannerStore } from '@/store/planner-store';
import { createAppTheme, resolveAppearance } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const themePreference = usePlannerStore((state) => state.themePreference);
  const accentTheme = usePlannerStore((state) => state.activeAccentTheme);
  const appearance = resolveAppearance(themePreference, systemScheme);
  const appTheme = useMemo(() => createAppTheme(appearance, accentTheme), [accentTheme, appearance]);
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(appTheme.colors.background).catch(() => undefined);
  }, [appTheme.colors.background]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const navigationTheme = appTheme.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: appTheme.colors.accentSecondary,
          background: appTheme.colors.background,
          card: appTheme.colors.surface,
          text: appTheme.colors.text,
          border: appTheme.colors.border,
          notification: appTheme.colors.accent,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: appTheme.colors.accentSecondary,
          background: appTheme.colors.background,
          card: appTheme.colors.surface,
          text: appTheme.colors.text,
          border: appTheme.colors.border,
          notification: appTheme.colors.accent,
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
