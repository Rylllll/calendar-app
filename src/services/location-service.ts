import * as Location from 'expo-location';
import { Platform } from 'react-native';

import {
  DeviceLocationPermission,
  DeviceLocationSnapshot,
} from '@/types/domain';
import { round } from '@/utils/math';

export interface DeviceLocationPayload {
  available: boolean;
  permission: DeviceLocationPermission;
  snapshot: DeviceLocationSnapshot | null;
}

export async function syncDeviceLocation(): Promise<DeviceLocationPayload> {
  if (Platform.OS === 'web') {
    return {
      available: false,
      permission: 'unavailable',
      snapshot: null,
    };
  }

  const permission = await ensureForegroundPermission();
  if (permission !== 'granted') {
    return {
      available: true,
      permission,
      snapshot: null,
    };
  }

  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  if (!position) {
    return {
      available: true,
      permission: 'granted',
      snapshot: null,
    };
  }

  const reverseGeocode = await Location.reverseGeocodeAsync({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }).catch(() => []);

  const firstPlace = reverseGeocode[0];
  const snapshot: DeviceLocationSnapshot = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    label: buildLocationLabel(
      firstPlace?.district ?? null,
      firstPlace?.city ?? null,
      firstPlace?.region ?? null,
      position.coords.latitude,
      position.coords.longitude,
    ),
    city: firstPlace?.city ?? null,
    region: firstPlace?.region ?? null,
    country: firstPlace?.country ?? null,
    countryCode: firstPlace?.isoCountryCode ?? null,
    fetchedAt: new Date().toISOString(),
  };

  return {
    available: true,
    permission: 'granted',
    snapshot,
  };
}

async function ensureForegroundPermission(): Promise<DeviceLocationPermission> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === 'granted') {
    return 'granted';
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === 'granted' ? 'granted' : 'denied';
}

function buildLocationLabel(
  district: string | null,
  city: string | null,
  region: string | null,
  latitude: number,
  longitude: number,
) {
  const parts = [district, city, region].filter(Boolean);
  if (parts.length) {
    return parts.join(', ');
  }

  return `${round(latitude, 3)}, ${round(longitude, 3)}`;
}
