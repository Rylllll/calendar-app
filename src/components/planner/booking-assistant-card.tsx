import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  BookingDraft,
  buildBookingDraft,
  confirmBookingDraft,
} from '@/services/booking-service';
import { PlannedTripPayload } from '@/services/trip-planner-service';
import { DeviceLocationSnapshot, Trip } from '@/types/domain';
import { formatShortDate } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

interface BookingAssistantCardProps {
  activeTrip?: Trip | null;
  origin: DeviceLocationSnapshot | null;
  onTripReady: (data: PlannedTripPayload) => void;
}

export function BookingAssistantCard({
  activeTrip,
  origin,
  onTripReady,
}: BookingAssistantCardProps) {
  const theme = useAppTheme();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string | null>(null);

  const handleAISearch = async () => {
    if (!prompt.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setDraft(null);
    setConfirmedReference(null);

    try {
      const nextDraft = await buildBookingDraft(prompt, origin, activeTrip);
      setDraft(nextDraft);
    } catch {
      setError(
        'I could not build a booking draft from that request. Try a clearer destination and a simple date hint like next week or weekend.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!draft) {
      return;
    }

    const payload = confirmBookingDraft(draft);
    onTripReady(payload);
    setDraft({
      ...draft,
      trip: payload.trip,
    });
    setConfirmedReference(payload.trip.confirmedBooking?.reference ?? null);
  };

  return (
    <SectionCard variant="accent">
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={theme.colors.text} />
            <Text style={[styles.title, { color: theme.colors.text }]}>Auto-booking assistant</Text>
          </View>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            Give one sentence with destination, rough date, and headcount. The app drafts a trip,
            pulls live transport hubs, and waits for your confirmation.
          </Text>
        </View>
        <Pill label="Confirm first" tone="dark" />
      </View>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        placeholder="Example: Book me a 3-day Baguio trip next weekend for 2 people under 12000"
        placeholderTextColor={theme.colors.textMuted}
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <View style={styles.helperRow}>
        <Pill label={origin?.country ?? 'Location aware'} tone="secondary" />
        <Pill label={activeTrip ? 'Uses current trip context' : 'Creates a new trip draft'} tone="secondary" />
      </View>

      <PlannerPressable
        style={[styles.primaryButton, { backgroundColor: theme.colors.surfaceStrong }]}
        onPress={handleAISearch}
        disabled={loading || !prompt.trim()}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="creation-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonLabel}>Draft booking plan</Text>
          </>
        )}
      </PlannerPressable>

      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>{error}</Text>
      ) : null}

      {draft ? (
        <View
          style={[
            styles.draftCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.draftHeader}>
            <View style={styles.draftHeaderBody}>
              <Text style={[styles.draftTitle, { color: theme.colors.text }]}>
                {draft.trip.destination.name}
              </Text>
              <Text style={[styles.draftMeta, { color: theme.colors.textMuted }]}>
                {formatShortDate(draft.trip.startDate)} to {formatShortDate(draft.trip.endDate)} -{' '}
                {draft.trip.groupSize} traveler{draft.trip.groupSize > 1 ? 's' : ''}
              </Text>
            </View>
            <Pill label={draft.selectedConnection?.mode ?? 'Stay'} tone="secondary" />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCell
              icon="airplane-takeoff"
              label="Route"
              value={draft.selectedConnection?.title ?? 'Stay-first draft'}
            />
            <SummaryCell
              icon="bed-outline"
              label="Stay"
              value={draft.selectedStay?.title ?? 'No stay match yet'}
            />
            <SummaryCell
              icon="cash-multiple"
              label="Estimate"
              value={formatCurrency(draft.totalEstimatedPrice, {
                currency: draft.trip.currencyCode,
              })}
            />
            <SummaryCell
              icon="open-in-new"
              label="Provider"
              value={draft.providerLabel}
            />
          </View>

          <Text style={[styles.confirmationHint, { color: theme.colors.textMuted }]}>
            {draft.confirmationHint}
          </Text>

          {confirmedReference ? (
            <View
              style={[
                styles.confirmedBanner,
                { backgroundColor: theme.colors.backgroundSecondary },
              ]}>
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={18}
                color={theme.colors.text}
              />
              <Text style={[styles.confirmedText, { color: theme.colors.text }]}>
                Saved locally as booking {confirmedReference}.
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <PlannerPressable
              style={[styles.secondaryButton, { backgroundColor: theme.colors.backgroundSecondary }]}
              onPress={() => {
                Linking.openURL(draft.providerActionUrl).catch(() => undefined);
              }}>
              <MaterialCommunityIcons name="open-in-new" size={16} color={theme.colors.text} />
              <Text style={[styles.secondaryButtonLabel, { color: theme.colors.text }]}>
                Open provider
              </Text>
            </PlannerPressable>
            <PlannerPressable
              style={[styles.confirmButton, { backgroundColor: '#171717' }]}
              onPress={handleConfirm}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.confirmButtonLabel}>Confirm and save</Text>
            </PlannerPressable>
          </View>
        </View>
      ) : null}
    </SectionCard>
  );
}

function SummaryCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.summaryCell,
        { backgroundColor: theme.colors.backgroundSecondary },
      ]}>
      <MaterialCommunityIcons name={icon} size={16} color={theme.colors.text} />
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text numberOfLines={2} style={[styles.summaryValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerBody: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  input: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  helperRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  errorText: {
    marginTop: 12,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  draftCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  draftHeaderBody: {
    flex: 1,
    gap: 4,
  },
  draftTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 20,
  },
  draftMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  summaryCell: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 18,
  },
  confirmationHint: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  confirmedBanner: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmedText: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
  },
});
