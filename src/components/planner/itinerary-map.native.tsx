import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { ItineraryStop } from '@/types/domain';

interface ItineraryMapProps {
  stops: ItineraryStop[];
  selectedStopId: string;
  onSelect: (stopId: string) => void;
}

export function ItineraryMap({ stops, selectedStopId, onSelect }: ItineraryMapProps) {
  const selectedStop = stops.find((stop) => stop.id === selectedStopId) ?? stops[0];
  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: selectedStop.place.latitude,
          longitude: selectedStop.place.longitude,
          latitudeDelta: 0.22,
          longitudeDelta: 0.22,
        }}>
        <Polyline
          coordinates={stops.map((stop) => ({
            latitude: stop.place.latitude,
            longitude: stop.place.longitude,
          }))}
          strokeWidth={5}
          strokeColor="#171717"
        />
        {stops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.place.latitude,
              longitude: stop.place.longitude,
            }}
            title={stop.title}
            description={stop.subtitle}
            pinColor={stop.id === selectedStopId ? '#97C766' : '#8C8C8C'}
            onPress={() => onSelect(stop.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    borderRadius: 28,
    overflow: 'hidden',
  },
});
