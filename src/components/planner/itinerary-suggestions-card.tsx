import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ItinerarySuggestion } from '@/types/domain';
import { formatCurrency } from '@/utils/format';

interface ItinerarySuggestionsCardProps {
  suggestions: ItinerarySuggestion[];
  currencyCode?: string;
  currencyLocale?: string;
}

const categoryLabels = {
  stay: 'Stay',
  sights: 'Sights',
  food: 'Food',
  coffee: 'Coffee',
  transit: 'Transit',
} as const;

export function ItinerarySuggestionsCard({
  suggestions,
  currencyCode = 'USD',
  currencyLocale = 'en-US',
}: ItinerarySuggestionsCardProps) {
  const theme = useAppTheme();

  if (!suggestions.length) {
    return null;
  }

  return (
    <SectionCard>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Available itinerary options
          </Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            Live place data with local estimated pricing. Use maps or jump to a provider search.
          </Text>
        </View>
        <Pill label={`${suggestions.length} options`} tone="secondary" />
      </View>

      <View style={styles.list}>
        {suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={[styles.row, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.rowBody}>
              <View style={styles.rowTitleWrap}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                  {suggestion.title}
                </Text>
                <Pill label={categoryLabels[suggestion.category]} tone="dark" />
              </View>
              <Text style={[styles.rowSubtitle, { color: theme.colors.textMuted }]}>
                {suggestion.subtitle}
              </Text>
              <Text style={[styles.rowPrice, { color: theme.colors.text }]}>
                {formatSuggestionPrice(suggestion, currencyCode, currencyLocale)}
              </Text>
            </View>

            <View style={styles.actions}>
              <PlannerPressable
                onPress={() => {
                  Linking.openURL(suggestion.mapsUrl).catch(() => undefined);
                }}
                style={[styles.iconAction, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons name="map-search-outline" size={18} color={theme.colors.text} />
              </PlannerPressable>
              <PlannerPressable
                onPress={() => {
                  Linking.openURL(suggestion.bookingUrl).catch(() => undefined);
                }}
                style={[styles.iconAction, { backgroundColor: theme.colors.surfaceStrong }]}>
                <MaterialCommunityIcons
                  name={suggestion.category === 'stay' ? 'bed-outline' : 'open-in-new'}
                  size={18}
                  color="#FFFFFF"
                />
              </PlannerPressable>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function formatSuggestionPrice(
  suggestion: ItinerarySuggestion,
  currencyCode: string,
  currencyLocale: string,
) {
  const suffix =
    suggestion.priceUnit === 'per_night'
      ? '/night'
      : suggestion.priceUnit === 'per_group'
        ? '/group'
        : '/person';

  return `${formatCurrency(suggestion.estimatedPrice, {
    currency: currencyCode,
    locale: currencyLocale,
  })} ${suffix}`;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBody: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    marginTop: 16,
    gap: 10,
  },
  row: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  rowSubtitle: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  rowPrice: {
    marginTop: 4,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
  },
  iconAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
