import type { DayKey } from '../core/types';

// How short dates are written, chosen in Settings (independent of the language)

export type DateFormat = 'day_first' | 'month_first';

export const DEFAULT_DATE_FORMAT: DateFormat = 'day_first';

// "2026-11-07" -> "07/11" (day first) or "11/07" (month first)
export function formatDayMonth(day_key: DayKey, format: DateFormat): string
{
    const [, month, day] = day_key.split('-');
    return format === 'day_first' ? `${day}/${month}` : `${month}/${day}`;
}
