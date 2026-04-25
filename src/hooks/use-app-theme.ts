import { useColorScheme } from 'react-native';

import { usePlannerStore } from '@/store/planner-store';
import { createAppTheme, resolveAppearance } from '@/theme';

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const preference = usePlannerStore((state) => state.themePreference);
  const accent = usePlannerStore((state) => state.activeAccentTheme);
  return createAppTheme(resolveAppearance(preference, systemScheme), accent);
}
