import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { DayTimeline } from '@/components/planner/day-timeline';
import { DeviceCalendarDetailCard } from '@/components/planner/device-calendar-detail-card';
import { DeviceCalendarSyncCard } from '@/components/planner/device-calendar-sync-card';
import { JourneyBridgeCard } from '@/components/planner/journey-bridge-card';
import { MiniCalendar } from '@/components/planner/mini-calendar';
import { PlannerPressable } from '@/components/ui/planner-pressable';
import { ScreenShell } from '@/components/ui/screen-shell';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCalendar } from '@/hooks/use-calendar';
import { useDeviceCalendar } from '@/hooks/use-device-calendar';
import { usePlanner } from '@/hooks/use-planner';
import { useTrip } from '@/hooks/use-trip';

export default function CalendarScreen() {
  const theme = useAppTheme();
  const planner = usePlanner();
  const isTripMode = planner.tripModeEnabled;

  const { days, combinedAgenda, deviceAgenda, selectedDate, setSelectedDate } = useCalendar();
  const trip = useTrip();
  const deviceCalendar = useDeviceCalendar();
  const [selectedDeviceEventId, setSelectedDeviceEventId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDeviceEventId(deviceAgenda[0]?.id ?? null);
  }, [deviceAgenda]);

  const selectedDeviceEvent =
    deviceAgenda.find((event) => event.id === selectedDeviceEventId) ?? deviceAgenda[0];

  return (
    <ScreenShell
      title="Calendar"
      subtitle={isTripMode ? "Your planner, AI schedule blocks, and phone calendar merged into one timeline." : "Your timeline."}
      rightAction={
        <PlannerPressable
          onPress={() => void deviceCalendar.syncPhoneCalendar()}
          style={[
            styles.syncAction,
            { backgroundColor: theme.colors.surfaceStrong },
          ]}>
          <MaterialCommunityIcons
            name={deviceCalendar.loading ? 'loading' : 'calendar-sync-outline'}
            size={20}
            color="#FFFFFF"
          />
        </PlannerPressable>
      }>
      <DeviceCalendarSyncCard
        permission={deviceCalendar.deviceCalendarPermission}
        calendars={deviceCalendar.deviceCalendars}
        eventsCount={deviceCalendar.deviceCalendarEvents.length}
        loading={deviceCalendar.loading}
        lastSyncedAt={deviceCalendar.deviceCalendarLastSyncedAt}
        onSync={() => void deviceCalendar.syncPhoneCalendar()}
      />
      
      {isTripMode && (
        <JourneyBridgeCard
          trip={trip.activeTrip}
          instruction={
            trip.activeTrip
              ? 'Use Calendar to confirm real event timing against the active trip, then return to Trip if the transport plan needs adjustment.'
              : 'Sync the phone calendar first, then add a trip so this timeline can blend real plans with travel buffers.'
          }
        />
      )}
      
      <MiniCalendar days={days} selectedDate={selectedDate} onSelect={setSelectedDate} />
      
      <DayTimeline
        events={isTripMode 
          ? [...trip.predictiveBlocks, ...trip.smartScheduleBlocks, ...combinedAgenda] 
          : combinedAgenda
        }
        title={isTripMode ? "Unified agenda" : "Agenda"}
        selectedEventId={selectedDeviceEventId ? `device-${selectedDeviceEventId}` : null}
        onEventPress={(event) => {
          if (event.source === 'device') {
            setSelectedDeviceEventId(event.id.replace('device-', ''));
          }
        }}
      />
      {selectedDeviceEvent ? (
        <DeviceCalendarDetailCard
          event={selectedDeviceEvent}
          onOpenNative={deviceCalendar.openNativeEvent}
        />
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  syncAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});