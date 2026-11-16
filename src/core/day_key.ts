import type { DayKey } from './types';

// "App days" start at 4 AM local time, not midnight, so a late-night
// session at 1 AM still counts for the evening before.
//
// Time zone is passed in as the offset from Date#getTimezoneOffset()
// (minutes, UTC minus local; Vietnam = -420) so these functions stay pure.

export const DAY_START_HOUR = 4;

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

function pad2(value: number): string
{
    return String(value).padStart(2, '0');
}

// Epoch ms -> app day key
export function getDayKey(epoch_ms: number, timezone_offset_minutes: number): DayKey
{
    const local_ms = epoch_ms - timezone_offset_minutes * MS_PER_MINUTE;
    const shifted = new Date(local_ms - DAY_START_HOUR * 60 * MS_PER_MINUTE);
    return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`;
}

// Day key -> UTC midnight of that calendar date (only used for date math)
function toUtcMs(day_key: DayKey): number
{
    const [year, month, day] = day_key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
}

function fromUtcMs(utc_ms: number): DayKey
{
    const date = new Date(utc_ms);
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function addDays(day_key: DayKey, days: number): DayKey
{
    return fromUtcMs(toUtcMs(day_key) + days * MS_PER_DAY);
}

// Whole days from `from` to `to` (positive when `to` is later)
export function daysBetween(from: DayKey, to: DayKey): number
{
    return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

// 0 = Sunday ... 6 = Saturday, same as Date#getDay
export function getWeekday(day_key: DayKey): number
{
    return new Date(toUtcMs(day_key)).getUTCDay();
}

// Keys work as strings for ordering because they are zero-padded YYYY-MM-DD
export function compareDayKeys(a: DayKey, b: DayKey): number
{
    if (a < b)
    {
        return -1;
    }
    return a > b ? 1 : 0;
}
