import { Platform } from 'react-native';

import { ItineraryStop } from '@/types/domain';
import { ItineraryMap as NativeMap } from './itinerary-map.native';
import { ItineraryMap as WebMap } from './itinerary-map.web';

interface ItineraryMapProps {
  stops: ItineraryStop[];
  selectedStopId: string;
  onSelect: (stopId: string) => void;
}

export function ItineraryMap(props: ItineraryMapProps) {
  if (Platform.OS === 'web') {
    return <WebMap {...props} />;
  }

  return <NativeMap {...props} />;
}
