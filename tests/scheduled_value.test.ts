import { describe, expect, it } from 'vitest';
import { createSchedule, getValueForDay, scheduleChange, setupValue } from '../src/core/scheduled_value';

describe('setupValue', () =>
{
    const first_day = '2026-11-10';
    const today = '2026-11-18';

    it('applies from the first day when there is no history yet', () =>
    {
        const schedule = setupValue(createSchedule(2, first_day), 4, first_day, today, false);
        expect(getValueForDay(schedule, first_day)).toBe(4);
        expect(getValueForDay(schedule, today)).toBe(4);
    });

    it('waits for tomorrow once there is history', () =>
    {
        const schedule = setupValue(createSchedule(2, first_day), 4, first_day, today, true);
        expect(getValueForDay(schedule, today)).toBe(2);
        expect(getValueForDay(schedule, '2026-11-19')).toBe(4);
        expect(schedule).toEqual(scheduleChange(createSchedule(2, first_day), 4, today));
    });

    it('keeps the schedule when the same value is picked again', () =>
    {
        const schedule = createSchedule([1, 4], first_day);
        expect(setupValue(schedule, [1, 4], first_day, today, true)).toBe(schedule);
    });
});
