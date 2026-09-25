/**
 * Flow Studio Device Timezone & Calendar Grounding Utility
 * Ensures all dates, times, and relative calendar parsing accurately respect
 * the user device's local timezone with zero UTC offset rollbacks or hallucinations.
 */

/**
 * Returns the IANA time zone identifier of the user's device.
 * e.g., "Asia/Dhaka", "America/New_York", "Europe/London"
 */
export function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Returns the formatted GMT/UTC offset for a given timezone or the device's timezone.
 * e.g., "GMT+6", "GMT-4", "GMT+0"
 */
export function getUserTimeZoneOffset(timeZone?: string): string {
  try {
    const tz = timeZone || getUserTimeZone();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      return tzPart.value;
    }
  } catch { }

  // Fallback using getTimezoneOffset
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  return minutes > 0
    ? `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`
    : `GMT${sign}${hours}`;
}

/**
 * Returns complete timezone details for display and metadata.
 */
export interface TimeZoneInfo {
  timeZone: string;
  offset: string;
  label: string;
  currentTime: string;
  currentDate: string;
}

export function getUserTimeZoneDetails(timeZone?: string): TimeZoneInfo {
  const tz = timeZone || getUserTimeZone();
  const offset = getUserTimeZoneOffset(tz);
  const now = new Date();

  let timeStr = '';
  try {
    timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(now);
  } catch {
    timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const dateStr = formatLocalDate(now, tz);

  return {
    timeZone: tz,
    offset,
    label: `${tz.replace(/_/g, ' ')} (${offset})`,
    currentTime: timeStr,
    currentDate: dateStr
  };
}

/**
 * Formats any Date into YYYY-MM-DD in the user's device local timezone
 * (or specified timezone) without UTC date-shift bugs.
 */
export function formatLocalDate(date?: Date | string | number | null, timeZone?: string): string {
  if (!date) return '';

  let d: Date;
  if (typeof date === 'string') {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    d = new Date(date);
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return '';

  try {
    const tz = timeZone || getUserTimeZone();
    // 'en-CA' gives YYYY-MM-DD format consistently across all browsers
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  } catch {
    // Fallback: local getFullYear, getMonth, getDate
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Formats a Date object or timestamp into user-friendly localized time.
 */
export function formatLocalTime(
  date?: Date | string | number | null,
  timeZone?: string,
  includeSeconds = false
): string {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  try {
    const tz = timeZone || getUserTimeZone();
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Common timezone presets for user selection if they choose to override device timezone.
 */
export const COMMON_TIMEZONES = [
  { value: 'auto', label: 'Auto (Device Timezone)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' }
];
