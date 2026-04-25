import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/pill';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { SectionCard } from '@/components/ui/section-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TransportConnection, TransportHub, TransportHubType } from '@/types/domain';
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
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Verified transport and navigation
          </Text>
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>
            Live transport APIs are used to pull airports, bus terminals, rail stations, and ferry
            terminals around your route.
          </Text>
        </View>
        <Pill label={`${connections.length} routes`} tone="dark" />
      </View>

      <View style={styles.contextRow}>
        <Pill label={`Origin ${currentCountry ?? 'Unknown'}`} tone="secondary" />
        <Pill label={`Destination ${destinationCountry ?? 'Unknown'}`} tone="secondary" />
      </View>

      {connections.length ? (
        <View style={styles.routeList}>
          {connections.map((connection) => (
            <View
              key={connection.id}
              style={[styles.routeRow, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.routeBody}>
                <View style={styles.routeHeader}>
                  <Text numberOfLines={2} style={[styles.routeTitle, { color: theme.colors.text }]}>
                    {connection.title}
                  </Text>
                  <Pill label={formatConnectionMode(connection.mode)} tone="dark" />
                </View>
                <Text style={[styles.routeMeta, { color: theme.colors.textMuted }]}>
                  {connection.subtitle}
                </Text>
                <View style={styles.routeMetrics}>
                  <MetricText
                    label="ETA"
                    value={`${Math.round(connection.durationMinutes / 60)}h ${connection.durationMinutes % 60}m`}
                  />
                  <MetricText
                    label="Estimate"
                    value={formatCurrency(connection.estimatedPrice, {
                      currency: currencyCode,
                      locale: currencyLocale,
                    })}
                  />
                </View>
              </View>
              <View style={styles.routeActions}>
                <PlannerPressable
                  onPress={() => {
                    Linking.openURL(connection.mapsUrl).catch(() => undefined);
                  }}
                  style={[styles.iconAction, { backgroundColor: theme.colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons
                    name={getConnectionIcon(connection.mode)}
                    size={18}
                    color={theme.colors.text}
                  />
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
            No route pair is strong enough yet
          </Text>
          <Text style={[styles.emptyDetail, { color: theme.colors.textMuted }]}>
            Try a more specific destination or sync location again so the origin search can match
            real hubs near you.
          </Text>
        </View>
      )}

      <View style={styles.hubSection}>
        <HubGroup title="Origin departure hubs" hubs={originHubs} />
        <HubGroup title="Destination navigation hubs" hubs={destinationHubs} />
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
              <View
                style={[styles.hubIconBubble, { backgroundColor: theme.colors.surface }]}>
                <MaterialCommunityIcons
                  name={getHubIcon(hub.type)}
                  size={16}
                  color={theme.colors.text}
                />
              </View>
              <View style={styles.hubBody}>
                <View style={styles.hubHeading}>
                  <Text style={[styles.hubName, { color: theme.colors.text }]}>
                    {hub.code ? `${hub.name} (${hub.code})` : hub.name}
                  </Text>
                  <Pill label={formatHubType(hub.type)} tone="secondary" />
                </View>
                <Text style={[styles.hubMeta, { color: theme.colors.textMuted }]}>{hub.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.emptyHubText, { color: theme.colors.textMuted }]}>
          No verified hubs were found in the nearby search radius.
        </Text>
      )}
    </View>
  );
}

function MetricText({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.metricText}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

function getHubIcon(type: TransportHubType): keyof typeof MaterialCommunityIcons.glyphMap {
  if (type === 'airport') {
    return 'airplane';
  }
  if (type === 'bus_terminal') {
    return 'bus';
  }
  if (type === 'rail_station') {
    return 'train';
  }
  return 'ferry';
}

function getConnectionIcon(mode: TransportConnection['mode']): keyof typeof MaterialCommunityIcons.glyphMap {
  if (mode === 'flight') {
    return 'airplane-takeoff';
  }
  if (mode === 'rail') {
    return 'train';
  }
  return 'bus-clock';
}

function formatHubType(type: TransportHubType) {
  if (type === 'airport') {
    return 'Airport';
  }
  if (type === 'bus_terminal') {
    return 'Bus';
  }
  if (type === 'rail_station') {
    return 'Rail';
  }
  return 'Ferry';
}

function formatConnectionMode(mode: TransportConnection['mode']) {
  if (mode === 'flight') {
    return 'Flight';
  }
  if (mode === 'rail') {
    return 'Rail';
  }
  return 'Bus';
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
  contextRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    gap: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  routeTitle: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  routeMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  routeMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricText: {
    gap: 2,
  },
  metricLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  metricValue: {
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
  hubIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubBody: {
    flex: 1,
    gap: 4,
  },
  hubHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  hubName: {
    flex: 1,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  hubMeta: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 17,
  },
  emptyHubText: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
});
