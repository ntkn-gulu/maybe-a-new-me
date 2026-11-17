import { getWeekday } from './day_key';
import type { DayKey } from './types';

// Month grid for the streak calendar. Pure date math on "YYYY-MM" keys.
// Weeks start on Monday, the way Vietnamese calendars are printed.

// A calendar month written as YYYY-MM
export type MonthKey = string;

export const DAYS_PER_WEEK = 7;
export const WEEK_START_WEEKDAY = 1;               // 1 = Monday (0 = Sunday)

function pad2(value: number): string
{
    return String(value).padStart(2, '0');
}

export interface MonthParts
{
    year: number;
    month: number;                                 // 1..12
}

export function getMonthParts(month_key: MonthKey): MonthParts
{
    const [year, month] = month_key.split('-').map(Number);
    return { year, month };
}

export function getMonthKey(day_key: DayKey): MonthKey
{
    return day_key.slice(0, 7);
}

export function addMonths(month_key: MonthKey, months: number): MonthKey
{
    const { year, month } = getMonthParts(month_key);
    const month_index = year * 12 + (month - 1) + months;
    return `${Math.floor(month_index / 12)}-${pad2((month_index % 12) + 1)}`;
}

export function getDaysInMonth(month_key: MonthKey): number
{
    const { year, month } = getMonthParts(month_key);
    // Day 0 of the next month is the last day of this one
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Weekday numbers (0 = Sunday) in the order the calendar header shows them
export function getWeekdayOrder(): number[]
{
    return Array.from({ length: DAYS_PER_WEEK }, (_, offset) => (WEEK_START_WEEKDAY + offset) % DAYS_PER_WEEK);
}

// Every day of the month, padded with nulls before the 1st and after the
// last day so the grid is made of whole weeks.
export function buildMonthGrid(month_key: MonthKey): (DayKey | null)[]
{
    const first_day = `${month_key}-01`;
    const leading_blanks = (getWeekday(first_day) - WEEK_START_WEEKDAY + DAYS_PER_WEEK) % DAYS_PER_WEEK;
    const day_count = getDaysInMonth(month_key);

    const cells: (DayKey | null)[] = Array.from({ length: leading_blanks }, () => null);
    for (let day = 1; day <= day_count; day++)
    {
        cells.push(`${month_key}-${pad2(day)}`);
    }
    while (cells.length % DAYS_PER_WEEK !== 0)
    {
        cells.push(null);
    }
    return cells;
}
