import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  PlanTripInput,
  PlannedTripPayload,
  planTripWithAssistant,
} from '@/services/trip-planner-service';
import { DeviceLocationSnapshot, Trip } from '@/types/domain';

interface BookingAssistantCardProps {
  activeTrip?: Trip;
  origin?: DeviceLocationSnapshot | null;
  onTripReady: (payload: PlannedTripPayload) => void;
}

const interestOptions = ['Food', 'Culture', 'Coffee', 'Nature', 'Easy'];

export function BookingAssistantCard({
  activeTrip,
  origin,
  onTripReady,
}: BookingAssistantCardProps) {
  const theme = useAppTheme();
  const [destinationQuery, setDestinationQuery] = useState(activeTrip?.destination.name ?? '');
  const [startDate, setStartDate] = useState(
    activeTrip ? format(new Date(activeTrip.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
  );
  const [endDate, setEndDate] = useState(
    activeTrip
      ? format(new Date(activeTrip.endDate), 'yyyy-MM-dd')
      : format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  );
  const [groupSize, setGroupSize] = useState(String(activeTrip?.groupSize ?? 1));
  const [budgetCeiling, setBudgetCeiling] = useState(
    String(activeTrip?.bookingPreference.budgetCeiling ?? 900),
  );
  const [request, setRequest] = useState(activeTrip?.vibe ?? '');
  const [interests, setInterests] = useState<string[]>(
    activeTrip?.assistantSummary
      ? interestOptions.filter((interest) =>
          activeTrip.assistantSummary.toLowerCase().includes(interest.toLowerCase()),
        )
      : ['Food', 'Culture'],
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTrip) {
      return;
    }

    setDestinationQuery(activeTrip.destination.name);
    setStartDate(format(new Date(activeTrip.startDate), 'yyyy-MM-dd'));
    setEndDate(format(new Date(activeTrip.endDate), 'yyyy-MM-dd'));
    setGroupSize(String(activeTrip.groupSize));
    setBudgetCeiling(String(activeTrip.bookingPreference.budgetCeiling));
    setRequest(activeTrip.vibe);
  }, [activeTrip]);

  const toggleInterest = (interest: string) => {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  const submit = async () => {
    if (!destinationQuery.trim()) {
      Alert.alert('Destination required', 'Enter a city or area to build the trip.');
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert('Dates required', 'Provide both start and end dates in YYYY-MM-DD format.');
      return;
    }

    const payload: PlanTripInput = {
      destinationQuery: destinationQuery.trim(),
      startDate,
      endDate,
      groupSize: Math.max(1, Number(groupSize) || 1),
      budgetCeiling: Math.max(150, Number(budgetCeiling) || 150),
      interests: interests.length ? interests : ['Food', 'Culture'],
      request,
      origin,
    };

    try {
      setLoading(true);
      const result = await planTripWithAssistant(payload);
      onTripReady(result);
    } catch {
      Alert.alert(
        'Trip planning failed',
        'The trip assistant could not build this itinerary. Check the destination and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard variant="secondary" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            AI booking assistant
          </Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            Ask for a destination, budget, and travel vibe. Voyagr builds the trip locally and prepares booking links.
          </Text>
        </View>
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: theme.colors.surfaceStrong },
          ]}>
          <MaterialCommunityIcons name="creation-outline" size={18} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.pills}>
        <Pill
          label={origin ? `From ${origin.city ?? origin.label}` : 'No live origin yet'}
          tone="dark"
        />
        <Pill label={activeTrip ? 'Editing active trip' : 'New trip'} tone="secondary" />
      </View>

      <View style={styles.form}>
        <Field
          label="Destination"
          value={destinationQuery}
          onChangeText={setDestinationQuery}
          placeholder="Tokyo, Cebu, Taipei..."
        />
        <View style={styles.splitRow}>
          <Field
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
          <Field
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
        <View style={styles.splitRow}>
          <Field
            label="Travelers"
            value={groupSize}
            onChangeText={setGroupSize}
            placeholder="1"
            keyboardType="number-pad"
          />
          <Field
            label="Budget cap"
            value={budgetCeiling}
            onChangeText={setBudgetCeiling}
            placeholder="900"
            keyboardType="number-pad"
          />
        </View>
        <Field
          label="Ask the assistant"
          value={request}
          onChangeText={setRequest}
          placeholder="Walkable food spots, easy transit, one museum day"
          multiline
        />
      </View>

      <View style={styles.interestsSection}>
        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Priorities</Text>
        <View style={styles.interestWrap}>
          {interestOptions.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <PlannerPressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.interestChip,
                  {
                    backgroundColor: selected
                      ? theme.colors.accentSecondarySoft
                      : theme.colors.backgroundSecondary,
                    borderColor: selected
                      ? theme.colors.accentSecondary
                      : theme.colors.border,
                  },
                ]}>
                <Text style={[styles.interestLabel, { color: theme.colors.text }]}>
                  {interest}
                </Text>
              </PlannerPressable>
            );
          })}
        </View>
      </View>

      <PlannerPressable
        onPress={() => void submit()}
        style={[
          styles.submitButton,
          {
            backgroundColor: loading ? theme.colors.backgroundSecondary : '#171717',
          },
        ]}>
        <MaterialCommunityIcons
          name={loading ? 'loading' : 'calendar-star'}
          size={18}
          color={loading ? theme.colors.text : '#FFFFFF'}
        />
        <Text style={[styles.submitLabel, { color: loading ? theme.colors.text : '#FFFFFF' }]}>
          {loading ? 'Building live itinerary...' : 'Auto-plan and prepare booking'}
        </Text>
      </PlannerPressable>
    </SectionCard>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'number-pad';
  multiline?: boolean;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: FieldProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 14,
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
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pills: {
    flexDirection: 'row',
    gap: 10,
  },
  form: {
    gap: 12,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  interestsSection: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  interestWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  interestLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  submitButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
