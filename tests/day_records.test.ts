import { describe, expect, it } from 'vitest';
import { buildDayRecord, buildDayRecords, countCompletedSessions, isSportDay, type DayRecordInput } from '../src/core/day_records';
import { createSchedule, scheduleChange } from '../src/core/scheduled_value';
import { computeStreak } from '../src/core/streak_engine';
import type { SessionRecord } from '../src/core/types';

// 2026-11-16 is a Monday
const MONDAY = '2026-11-16';

function session(day_key: string, status: 'completed' | 'broken' = 'completed'): SessionRecord
{
    return {
        id: `${day_key}-${Math.random()}`,
        day_key,
        started_at: 0,
        ended_at: 0,
        planned_minutes: 25,
        device: 'phone',
        status,
        break_reason: status === 'broken' ? 'left_app' : null,
        note: 'study',
    };
}

function baseInput(overrides: Partial<DayRecordInput> = {}): DayRecordInput
{
    return {
        first_day_key: MONDAY,
        today: '2026-11-19',
        sessions: [],
        sport_check_ins: [],
        goal_schedule: createSchedule(4, MONDAY),
        sport_weekday_schedule: createSchedule([1, 4], MONDAY),
        ...overrides,
    };
}

describe('day records', () =>
{
    it('counts only completed sessions of that day', () =>
    {
        const sessions = [session(MONDAY), session(MONDAY, 'broken'), session('2026-11-17')];
        expect(countCompletedSessions(sessions, MONDAY)).toBe(1);
    });

    it('knows the sport weekdays (Mon + Thu by default)', () =>
    {
        const schedule = createSchedule([1, 4], MONDAY);
        expect(isSportDay(schedule, MONDAY)).toBe(true);
        expect(isSportDay(schedule, '2026-11-17')).toBe(false);
        expect(isSportDay(schedule, '2026-11-19')).toBe(true);
    });

    it('builds one record per day from the first day to today', () =>
    {
        const records = buildDayRecords(baseInput());
        expect(records.map((record) => record.day_key)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19']);
    });

    it('uses the goal that applied on each day', () =>
    {
        const goal_schedule = scheduleChange(createSchedule(4, MONDAY), 2, '2026-11-17');
        const input = baseInput({ goal_schedule });
        expect(buildDayRecord(input, '2026-11-17').goal).toBe(4);
        expect(buildDayRecord(input, '2026-11-18').goal).toBe(2);
    });

    it('feeds the streak engine end to end', () =>
    {
        const sessions = [
            ...Array.from({ length: 4 }, () => session('2026-11-17')),   // Tue: goal met
            session(MONDAY),                                               // Mon: sport day, 1 session
        ];
        const sport_check_ins = [{ day_key: MONDAY, activity: 'badminton' as const, note: 'đánh đôi' }];
        const input = baseInput({ sessions, sport_check_ins, today: '2026-11-18' });
        const streak = computeStreak(buildDayRecords(input), input.today);
        expect(streak.current_streak).toBe(2);
        expect(streak.day_results['2026-11-18']).toBe('pending');
    });
});
