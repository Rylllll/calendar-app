import { BookingAlert, BookingPreference } from '@/types/domain';
import { matchBookingAvailability } from '@/services/travel-heuristics';

export async function checkBookingAvailability(
  preference: BookingPreference,
): Promise<BookingAlert[]> {
  await new Promise((resolve) => setTimeout(resolve, 850));
  return matchBookingAvailability(preference);
}
