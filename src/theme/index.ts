import { AccentTheme, ThemePreference } from '@/types/domain';

export interface AppTheme {
  isDark: boolean;
  accentKey: AccentTheme;
  colors: {
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceStrong: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
    accentSoft: string;
    accentSecondary: string;
    accentSecondarySoft: string;
    tabBar: string;
    tabActive: string;
    danger: string;
    success: string;
    shadow: string;
    overlay: string;
  };
}

const accentThemes = {
  aurora: {
    accent: '#CBE7A8',
    accentSoft: '#EAF6D8',
    accentSecondary: '#A9A0E8',
    accentSecondarySoft: '#E8E4FF',
  },
  midnight: {
    accent: '#7ED4C5',
    accentSoft: '#D7F5EF',
    accentSecondary: '#8F9DFF',
    accentSecondarySoft: '#DEE3FF',
  },
  citrus: {
    accent: '#FFD57A',
    accentSoft: '#FFF1CC',
    accentSecondary: '#FF9D76',
    accentSecondarySoft: '#FFE0D4',
  },
} as const;

export const accentThemeMeta = [
  { key: 'aurora' as const, label: 'Aurora Mint', unlockLabel: 'Starter' },
  { key: 'midnight' as const, label: 'Midnight Rail', unlockLabel: '180 pts' },
  { key: 'citrus' as const, label: 'Citrus Burst', unlockLabel: '420 pts' },
];

export function resolveAppearance(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | 'unspecified' | null | undefined,
) {
  if (preference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return preference;
}

export function createAppTheme(
  scheme: 'light' | 'dark',
  accentKey: AccentTheme,
): AppTheme {
  const accent = accentThemes[accentKey];
  const isDark = scheme === 'dark';
  return {
    isDark,
    accentKey,
    colors: {
      background: isDark ? '#101114' : '#F8F7F4',
      backgroundSecondary: isDark ? '#17181C' : '#F1EEE9',
      surface: isDark ? '#1B1D22' : '#FFFFFF',
      surfaceStrong: isDark ? '#23262D' : '#111111',
      text: isDark ? '#F7F7F2' : '#171717',
      textMuted: isDark ? '#A6ACB8' : '#747173',
      border: isDark ? '#2A2D36' : '#E8E3DB',
      accent: accent.accent,
      accentSoft: accent.accentSoft,
      accentSecondary: accent.accentSecondary,
      accentSecondarySoft: accent.accentSecondarySoft,
      tabBar: '#171717',
      tabActive: '#FFFFFF',
      danger: '#F87070',
      success: '#7CC48A',
      shadow: isDark ? 'rgba(0,0,0,0.42)' : 'rgba(18,18,18,0.08)',
      overlay: isDark ? 'rgba(8,8,12,0.74)' : 'rgba(255,255,255,0.75)',
    },
  };
}
