import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCurrency } from '@/utils/format';

interface BudgetOverviewCardProps {
  total: number;
  target: number;
  remaining: number;
  suggestions: string[];
  currencyCode?: string;
  currencyLocale?: string;
}

export function BudgetOverviewCard({
  total,
  target,
  remaining,
  suggestions,
  currencyCode = 'USD',
  currencyLocale = 'en-US',
}: BudgetOverviewCardProps) {
  const theme = useAppTheme();
  return (
    <SectionCard variant={remaining < 0 ? 'secondary' : 'default'}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Living budget</Text>
      <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
        Budget currency follows the current trip country so totals stay relevant to where you are going.
      </Text>
      <View style={styles.metrics}>
        <Metric
          label="Spent"
          value={formatCurrency(total, { currency: currencyCode, locale: currencyLocale })}
        />
        <Metric
          label="Cap"
          value={formatCurrency(target, { currency: currencyCode, locale: currencyLocale })}
        />
        <Metric
          label="Left"
          value={formatCurrency(remaining, { currency: currencyCode, locale: currencyLocale })}
        />
      </View>
      {suggestions.map((suggestion) => (
        <Text key={suggestion} style={[styles.suggestion, { color: theme.colors.textMuted }]}>
          {suggestion}
        </Text>
      ))}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  caption: {
    marginTop: 4,
    marginBottom: 14,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  metricValue: {
    marginTop: 4,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
  },
  suggestion: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
});
