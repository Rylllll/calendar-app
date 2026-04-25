import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TransportConnection, TransportHub } from '@/types/domain';
import { formatCurrency } from '@/utils/format';

interface TransportConnectionsCardProps {
  currentCountry?: string | null;
  destinationCountry?: string | null;
  connections: TransportConnection[];
  hubs: TransportHub[];
  currencyCode: string;
  currencyLocale: string;
}

export function TransportConnectionsCard({
  currentCountry,
  destinationCountry,
  connections,
  hubs,
  currencyCode,
  currencyLocale,
}: TransportConnectionsCardProps) {
  const theme = useAppTheme();
  const originHubs = hubs.filter((hub) => hub.area === 'origin');
  const destinationHubs = hubs.filter((hub) => hub.area === 'destination');

  return (
    <SectionCard variant="accent">
      <View style={styles.header}>
        <View style={styles.headerBody}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Connected transport</Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            Country detected: {currentCountry ?? 'Unknown'}.
            {' '}
            Matching airports and bus terminals are paired to {destinationCountry ?? 'your destination'}.
          </Text>
        </View>
        <Pill label={`${connections.length} routes`} tone="dark" />
      </View>

      <Text style={[styles.subtleGuide, { color: theme.colors.textMuted }]}>
        Tip: only verified nearby hubs are shown here. No placeholder airport names are injected anymore.
      </Text>

      {connections.length ? (
        <View style={styles.routeList}>
          {connections.map((connection) => (
            <View
              key={connection.id}
              style={[styles.routeRow, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.routeBody}>
                <View style={styles.routeHeader}>
                  <Text style={[styles.routeTitle, { color: theme.colors.text }]}>
                    {connection.title}
                  </Text>
                  <Pill
                    label={connection.mode === 'flight' ? 'Flight' : 'Bus'}
                    tone={connection.mode === 'flight' ? 'dark' : 'secondary'}
                  />
                </View>
                <Text style={[styles.routeMeta, { color: theme.colors.textMuted }]}>
                  {connection.subtitle}
                </Text>
                <Text style={[styles.routeStats, { color: theme.colors.text }]}>
                  {Math.round(connection.durationMinutes / 60)}h {connection.durationMinutes % 60}m
                  {' - '}
                  {formatCurrency(connection.estimatedPrice, {
                    currency: currencyCode,
                    locale: currencyLocale,
                  })}
                </Text>
              </View>
              <View style={styles.routeActions}>
                <PlannerPressable
                  onPress={() => {
                    Linking.openURL(connection.mapsUrl).catch(() => undefined);
                  }}
                  style={[styles.iconAction, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="map-search-outline" size={18} color={theme.colors.text} />
                </PlannerPressable>
                <PlannerPressable
                  onPress={() => {
                    Linking.openURL(connection.bookingUrl).catch(() => undefined);
                  }}
                  style={[styles.iconAction, { backgroundColor: theme.colors.surfaceStrong }]}>
                  <MaterialCommunityIcons name="open-in-new" size={18} color="#FFFFFF" />
                </PlannerPressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No verified route pair found yet
          </Text>
          <Text style={[styles.emptyDetail, { color: theme.colors.textMuted }]}>
            Try a more specific destination name or sync location again so the origin search can narrow to real airports and terminals near you.
          </Text>
        </View>
      )}

      <View style={styles.hubSection}>
        <HubGroup title="Origin hubs" hubs={originHubs} />
        <HubGroup title="Destination hubs" hubs={destinationHubs} />
      </View>
    </SectionCard>
  );
}

function HubGroup({ title, hubs }: { title: string; hubs: TransportHub[] }) {
  const theme = useAppTheme();

  return (
    <View style={styles.hubGroup}>
      <Text style={[styles.hubTitle, { color: theme.colors.text }]}>{title}</Text>
      {hubs.length ? (
        <View style={styles.hubList}>
          {hubs.map((hub) => (
            <View
              key={hub.id}
              style={[styles.hubChip, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <MaterialCommunityIcons
                name={hub.type === 'airport' ? 'airplane' : 'bus'}
                size={16}
                color={theme.colors.text}
              />
              <View style={styles.hubBody}>
                <Text style={[styles.hubName, { color: theme.colors.text }]}>
                  {hub.code ? `${hub.name} (${hub.code})` : hub.name}
                </Text>
                <Text style={[styles.hubMeta, { color: theme.colors.textMuted }]}>{hub.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyHubText, { color: theme.colors.textMuted }]}>
          No verified {title.toLowerCase()} found in the nearby search radius.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
  subtleGuide: {
    marginTop: 14,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
  },
  routeList: {
    marginTop: 16,
    gap: 10,
  },
  routeRow: {
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  routeBody: {
    flex: 1,
    gap: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  routeTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  routeMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  routeStats: {
    marginTop: 2,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  routeActions: {
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
  emptyState: {
    marginTop: 16,
    borderRadius: 22,
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  emptyDetail: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  hubSection: {
    marginTop: 18,
    gap: 14,
  },
  hubGroup: {
    gap: 10,
  },
  hubTitle: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  hubList: {
    gap: 8,
  },
  hubChip: {
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
  },
  hubBody: {
    flex: 1,
  },
  hubName: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  hubMeta: {
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
  },
  emptyHubText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
});
