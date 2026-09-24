import { formatLocalDate } from '../../../../lib/timezone';

export { formatLocalDate };

export function parseNaturalDate(inputDate?: string, _timeZone?: string): string {
  const today = new Date();
  if (!inputDate) return formatLocalDate(today);
  const str = inputDate.toLowerCase().trim();

  if (str === 'today') return formatLocalDate(today);
  if (str === 'tomorrow') {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return formatLocalDate(d);
  }
  if (str === 'yesterday') {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    return formatLocalDate(d);
  }

  // Days of week: e.g. "friday", "next monday"
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (str.includes(days[i])) {
      const cur = today.getDay();
      let diff = i - cur;
      if (diff <= 0) diff += 7;
      if (str.includes('next')) diff += 7;
      const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
      return formatLocalDate(target);
    }
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Month dictionary
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  // Match: "22 sep", "22nd september", "22-sep", "22nd of september 2026"
  const dayMonthMatch = str.match(/^(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+)?|-|\/)([a-zA-Z]+)(?:\s*,?\s*(\d{4}))?$/);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthStr = dayMonthMatch[2].toLowerCase();
    const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : today.getFullYear();
    const month = months[monthStr.slice(0, 3)];
    if (month !== undefined && day >= 1 && day <= 31) {
      const target = new Date(year, month, day);
      return formatLocalDate(target);
    }
  }

  // Match: "sep 22", "september 22nd", "sep-22"
  const monthDayMatch = str.match(/^([a-zA-Z]+)(?:\s+|-|\/)(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?$/);
  if (monthDayMatch) {
    const monthStr = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : today.getFullYear();
    const month = months[monthStr.slice(0, 3)];
    if (month !== undefined && day >= 1 && day <= 31) {
      const target = new Date(year, month, day);
      return formatLocalDate(target);
    }
  }

  // Match: "in X days"
  const inDaysMatch = str.match(/^in\s+(\d+)\s+days?$/);
  if (inDaysMatch) {
    const daysToAdd = parseInt(inDaysMatch[1], 10);
    const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToAdd);
    return formatLocalDate(target);
  }

  // Fallback to Date.parse, but ensure year is current year (2026) if year was omitted
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    if (d.getFullYear() < 2026 && !/\b20\d{2}\b/.test(str)) {
      d.setFullYear(today.getFullYear());
    }
    return formatLocalDate(d);
  }

  // Default fallback: 3 days from now
  const fallback = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  return formatLocalDate(fallback);
}
