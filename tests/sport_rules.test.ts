import { describe, expect, it } from 'vitest';
import { MIN_CHECK_IN_NOTE_LENGTH, SPORT_ACTIVITIES, canCheckInSport, isCheckInNoteValid } from '../src/core/sport_rules';
import { SPORT_DAY_MIN_SESSIONS, getSessionsToKeep } from '../src/core/streak_engine';
import type { DayRecord } from '../src/core/types';

function record(extra: Partial<DayRecord> = {}): DayRecord
{
    return {
        day_key: '2026-11-16',
        goal: 4,
        completed_count: 0,
        is_sport_day: true,
        sport_checked_in: false,
        sport_activity: null,
        ...extra,
    };
}

describe('sport check-in', () =>
{
    it('pins the agreed numbers', () =>
    {
        expect(MIN_CHECK_IN_NOTE_LENGTH).toBe(3);
        expect(SPORT_ACTIVITIES).toEqual(['badminton', 'gym', 'home_workout', 'running', 'other']);
    });

    it('is allowed once, only on a sport day', () =>
    {
        expect(canCheckInSport(record())).toBe(true);
        expect(canCheckInSport(record({ sport_checked_in: true, sport_activity: 'gym' }))).toBe(false);
        expect(canCheckInSport(record({ is_sport_day: false }))).toBe(false);
    });

    it('needs a short note, ignoring spaces', () =>
    {
        expect(isCheckInNoteValid('  ab  ')).toBe(false);
        expect(isCheckInNoteValid('gym')).toBe(true);
    });
});

describe('getSessionsToKeep', () =>
{
    it('counts down to the goal on a normal day', () =>
    {
        expect(getSessionsToKeep(record({ is_sport_day: false, completed_count: 1 }))).toBe(3);
    });

    it('is 0 once the day is kept', () =>
    {
        expect(getSessionsToKeep(record({ is_sport_day: false, completed_count: 5 }))).toBe(0);
    });

    it('drops to the sport minimum after a check-in', () =>
    {
        expect(getSessionsToKeep(record())).toBe(4);
        expect(getSessionsToKeep(record({ sport_checked_in: true }))).toBe(SPORT_DAY_MIN_SESSIONS);
        expect(getSessionsToKeep(record({ sport_checked_in: true, completed_count: 1 }))).toBe(0);
    });

    it('never asks for more than the goal', () =>
    {
        expect(getSessionsToKeep(record({ goal: 1, sport_checked_in: true }))).toBe(1);
    });
});
