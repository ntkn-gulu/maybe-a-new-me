import { describe, expect, it } from 'vitest';
import {
    DAYS_PER_WEEK,
    addMonths,
    buildMonthGrid,
    getDaysInMonth,
    getMonthKey,
    getMonthParts,
    getWeekdayOrder,
} from '../src/core/calendar_month';

describe('month keys', () =>
{
    it('takes the month from a day key', () =>
    {
        expect(getMonthKey('2026-11-17')).toBe('2026-11');
    });

    it('splits a month key into numbers', () =>
    {
        expect(getMonthParts('2026-02')).toEqual({ year: 2026, month: 2 });
    });

    it.each([
        ['2026-11', 1, '2026-12'],
        ['2026-12', 1, '2027-01'],
        ['2027-01', -1, '2026-12'],
        ['2026-05', -17, '2024-12'],
        ['2026-05', 0, '2026-05'],
    ])('%s + %i months = %s', (month_key, months, expected) =>
    {
        expect(addMonths(month_key, months)).toBe(expected);
    });
});

describe('getDaysInMonth', () =>
{
    it.each([
        ['2026-01', 31], ['2026-02', 28], ['2028-02', 29], ['2100-02', 28], ['2026-04', 30], ['2026-12', 31],
    ])('%s has %i days', (month_key, expected) =>
    {
        expect(getDaysInMonth(month_key)).toBe(expected);
    });
});

describe('getWeekdayOrder', () =>
{
    it('starts on Monday and ends on Sunday', () =>
    {
        expect(getWeekdayOrder()).toEqual([1, 2, 3, 4, 5, 6, 0]);
    });
});

describe('buildMonthGrid', () =>
{
    it('pads to whole weeks starting on Monday', () =>
    {
        // November 2026 starts on a Sunday: 6 blanks before the 1st
        const grid = buildMonthGrid('2026-11');
        expect(grid.length % DAYS_PER_WEEK).toBe(0);
        expect(grid.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
        expect(grid.filter((cell) => cell !== null)).toHaveLength(30);
        expect(grid.at(-1)).toBeNull();
    });

    it('has no leading blanks when the month starts on Monday', () =>
    {
        // June 2026 starts on a Monday
        expect(buildMonthGrid('2026-06')[0]).toBe('2026-06-01');
    });

    it('needs only 4 rows for a February that starts on Monday', () =>
    {
        // February 2027 starts on a Monday and has 28 days
        expect(buildMonthGrid('2027-02')).toHaveLength(28);
    });

    it('lists the days in order', () =>
    {
        const days = buildMonthGrid('2028-02').filter((cell) => cell !== null);
        expect(days[0]).toBe('2028-02-01');
        expect(days.at(-1)).toBe('2028-02-29');
    });
});
