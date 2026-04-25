import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { CheckInInfo } from '@/types/domain';
import { formatShortDate } from '@/utils/date';

interface CheckInCardProps {
  value: CheckInInfo;
  onChange: (field: keyof CheckInInfo, text: string) => void;
}

export function CheckInCard({ value, onChange }: CheckInCardProps) {
  const theme = useAppTheme();
  return (
    <SectionCard>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Check-in board</Text>
        <Pill label={formatShortDate(value.departureAt)} tone="secondary" />
      </View>
      <View style={styles.grid}>
        <Field label="Airline" value={value.airline} onChangeText={(text) => onChange('airline', text)} />
        <Field
          label="Flight"
          value={value.flightNumber}
          onChangeText={(text) => onChange('flightNumber', text)}
        />
        <Field
          label="Booking"
          value={value.bookingCode}
          onChangeText={(text) => onChange('bookingCode', text)}
        />
        <Field label="Gate" value={value.gate} onChangeText={(text) => onChange('gate', text)} />
      </View>
      <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
        Terminal {value.terminal} · Editable locally for offline travel mode
      </Text>
    </SectionCard>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            color: theme.colors.text,
            borderColor: theme.colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldWrap: {
    width: '47%',
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
  },
  meta: {
    marginTop: 12,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
});
