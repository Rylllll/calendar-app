import {
  addDays,
  addHours,
  addMinutes,
  endOfDay,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns';

export function startOfTodayIso() {
  return startOfDay(new Date()).toISOString();
}

export function buildTime(base: Date, hour: number, minute = 0) {
  return addMinutes(addHours(startOfDay(base), hour), minute).toISOString();
}

export function buildRelativeDay(base: Date, offset: number) {
  return addDays(startOfDay(base), offset);
}

export function formatShortDate(value: string) {
  return format(parseISO(value), 'EEE, dd MMM');
}

export function formatTimeline(value: string) {
  return format(parseISO(value), 'h:mm a');
}

export function formatDayNumber(value: string) {
  return format(parseISO(value), 'd');
}

export function formatWeekday(value: string) {
  return format(parseISO(value), 'EEE');
}

export function isSameCalendarDay(left: string, right: string) {
  return isSameDay(parseISO(left), parseISO(right));
}

export function endOfTodayIso() {
  return endOfDay(new Date()).toISOString();
}
