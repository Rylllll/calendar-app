import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { BudgetOverviewCard } from '@/components/planner/budget-overview-card';
import { JourneyBridgeCard } from '@/components/planner/journey-bridge-card';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { ScreenShell } from '@/components/ui/screen-shell';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBudget } from '@/hooks/use-budget';
import { useTrip } from '@/hooks/use-trip';
import { BudgetEntry } from '@/types/domain';
import { formatCurrency } from '@/utils/format';

export default function BudgetScreen() {
  const theme = useAppTheme();
  const budget = useBudget();
  const trip = useTrip();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');

  const addExpense = () => {
    if (!title || !amount) {
      return;
    }
    const entry: BudgetEntry = {
      id: `budget-${Date.now()}`,
      tripId: budget.activeTrip?.id,
      title,
      category: 'buffer',
      amount: Number(amount),
      perPerson: false,
      date: new Date().toISOString(),
    };
    budget.addBudgetEntry(entry);
    setTitle('');
    setAmount('');
  };

  return (
    <ScreenShell
      title="Budget"
      subtitle={
        budget.activeTrip
          ? `Budget follows ${budget.activeTrip.destinationCountry ?? budget.activeTrip.destination.name} in ${budget.currencyCode}.`
          : 'Every spend immediately updates the trip outlook.'
      }>
      <BudgetOverviewCard
        total={budget.total}
        target={budget.target}
        remaining={budget.remaining}
        suggestions={budget.suggestions}
        currencyCode={budget.currencyCode}
        currencyLocale={budget.currencyLocale}
      />

      <JourneyBridgeCard
        trip={budget.activeTrip}
        instruction={
          budget.activeTrip
            ? 'Check costs here after choosing routes in Trip. The same active trip now drives the budget totals and the home summary.'
            : 'Once a trip is active, this screen switches to that destination currency and keeps every tab in sync.'
        }
      />

      {trip.budgetPulse ? (
        <SectionCard variant="accent">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Budget pulse</Text>
          <Text style={[styles.sectionCaption, { color: theme.colors.textMuted }]}>
            Daily target:{' '}
            {formatCurrency(trip.budgetPulse.allocatedPerDay, {
              currency: budget.currencyCode,
              locale: budget.currencyLocale,
            })}
            . {trip.budgetPulse.note}
          </Text>
          <View style={styles.pulseRow}>
            <View style={[styles.pulseChip, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.pulseLabel, { color: theme.colors.textMuted }]}>Spent</Text>
              <Text style={[styles.pulseValue, { color: theme.colors.text }]}>
                {formatCurrency(trip.budgetPulse.spent, {
                  currency: budget.currencyCode,
                  locale: budget.currencyLocale,
                })}
              </Text>
            </View>
            <View style={[styles.pulseChip, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.pulseLabel, { color: theme.colors.textMuted }]}>Remaining</Text>
              <Text style={[styles.pulseValue, { color: theme.colors.text }]}>
                {formatCurrency(trip.budgetPulse.remaining, {
                  currency: budget.currencyCode,
                  locale: budget.currencyLocale,
                })}
              </Text>
            </View>
            <View style={[styles.pulseChip, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.pulseLabel, { color: theme.colors.textMuted }]}>Used</Text>
              <Text style={[styles.pulseValue, { color: theme.colors.text }]}>
                {Math.round(trip.budgetPulse.ratio * 100)}%
              </Text>
            </View>
          </View>
        </SectionCard>
      ) : null}

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick add</Text>
        <Text style={[styles.sectionCaption, { color: theme.colors.textMuted }]}>
          Enter the amount in {budget.currencyCode}. New entries update Home, Trip, and Budget instantly.
        </Text>
        <View style={styles.form}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Expense name"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
          />
          <TextInput
            value={amount}
            keyboardType="numeric"
            onChangeText={setAmount}
            placeholder={`Amount in ${budget.currencyCode}`}
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.backgroundSecondary,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
          />
        </View>
        <PlannerPressable
          style={[styles.button, { backgroundColor: '#171717' }]}
          onPress={addExpense}>
          <Text style={styles.buttonLabel}>Add local expense</Text>
        </PlannerPressable>
      </SectionCard>

      <SectionCard>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Impact per decision</Text>
        <View style={styles.list}>
          {budget.impact.map((entry) => (
            <View
              key={entry.id}
              style={[styles.row, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>{entry.title}</Text>
                <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>
                  {entry.perPerson ? 'per person x group' : 'shared cost'} - {entry.category}
                </Text>
              </View>
              <Text style={[styles.amount, { color: theme.colors.text }]}>
                {formatCurrency(entry.actualAmount, {
                  currency: budget.currencyCode,
                  locale: budget.currencyLocale,
                })}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  sectionCaption: {
    marginBottom: 12,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    gap: 10,
  },
  pulseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pulseChip: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
  },
  pulseLabel: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },
  pulseValue: {
    marginTop: 4,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  button: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  list: {
    gap: 10,
  },
  row: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  amount: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
});
