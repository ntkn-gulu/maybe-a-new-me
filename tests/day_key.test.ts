import { describe, expect, it } from 'vitest';
import { addDays, compareDayKeys, daysBetween, getDayKey, getWeekday } from '../src/core/day_key';
import { createSchedule, getPendingChange, getValueForDay, scheduleChange } from '../src/core/scheduled_value';

// Vietnam is UTC+7 -> Date#getTimezoneOffset() returns -420
const VIETNAM_OFFSET = -420;

// Build epoch ms for a Vietnam local time
function vietnamTime(iso_local: string): number
{
    return Date.parse(`${iso_local}+07:00`);
}

describe('getDayKey (4 AM day boundary)', () =>
{
    it('counts 1 AM as the previous day', () =>
    {
        expect(getDayKey(vietnamTime('2026-11-18T01:00:00'), VIETNAM_OFFSET)).toBe('2026-11-17');
    });

    it('switches to the new day exactly at 4 AM', () =>
    {
        expect(getDayKey(vietnamTime('2026-11-18T03:59:59'), VIETNAM_OFFSET)).toBe('2026-11-17');
        expect(getDayKey(vietnamTime('2026-11-18T04:00:00'), VIETNAM_OFFSET)).toBe('2026-11-18');
    });

    it('handles year boundaries', () =>
    {
        expect(getDayKey(vietnamTime('2027-01-01T02:00:00'), VIETNAM_OFFSET)).toBe('2026-12-31');
    });

    it('uses the given time zone, not the machine one', () =>
    {
        const instant = Date.parse('2026-11-17T22:00:00Z');
        expect(getDayKey(instant, VIETNAM_OFFSET)).toBe('2026-11-18');   // 05:00 in Vietnam
        expect(getDayKey(instant, 0)).toBe('2026-11-17');               // 22:00 in London
    });
});

describe('day math', () =>
{
    it('adds days across months and leap years', () =>
    {
        expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
        expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
        expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });

    it('counts days between keys', () =>
    {
        expect(daysBetween('2026-11-17', '2026-11-24')).toBe(7);
        expect(daysBetween('2026-11-24', '2026-11-17')).toBe(-7);
    });

    it('gives weekdays with 0 = Sunday', () =>
    {
        expect(getWeekday('2026-11-16')).toBe(1);   // Monday
        expect(getWeekday('2026-11-19')).toBe(4);   // Thursday
        expect(getWeekday('2026-11-22')).toBe(0);   // Sunday
    });

    it('orders keys', () =>
    {
        expect(compareDayKeys('2026-11-17', '2026-11-18')).toBe(-1);
        expect(compareDayKeys('2026-11-18', '2026-11-18')).toBe(0);
    });
});

describe('scheduled values (changes apply tomorrow)', () =>
{
    const today = '2026-11-17';

    it('keeps today unchanged and applies the new value tomorrow', () =>
    {
        const schedule = scheduleChange(createSchedule(4, '2026-11-01'), 1, today);
        expect(getValueForDay(schedule, today)).toBe(4);
        expect(getValueForDay(schedule, '2026-11-18')).toBe(1);
    });

    it('keeps the value past days really had', () =>
    {
        let schedule = createSchedule(4, '2026-11-01');
        schedule = scheduleChange(schedule, 6, '2026-11-05');
        expect(getValueForDay(schedule, '2026-11-05')).toBe(4);
        expect(getValueForDay(schedule, '2026-11-06')).toBe(6);
        expect(getValueForDay(schedule, today)).toBe(6);
    });

    it('replaces a pending change made the same day', () =>
    {
        let schedule = createSchedule(4, '2026-11-01');
        schedule = scheduleChange(schedule, 2, today);
        schedule = scheduleChange(schedule, 5, today);
        expect(schedule).toHaveLength(2);
        expect(getValueForDay(schedule, '2026-11-18')).toBe(5);
        expect(getPendingChange(schedule, today)?.value).toBe(5);
    });

    it('has no pending change once it applied', () =>
    {
        const schedule = scheduleChange(createSchedule(4, '2026-11-01'), 2, today);
        expect(getPendingChange(schedule, '2026-11-18')).toBeNull();
    });
});
