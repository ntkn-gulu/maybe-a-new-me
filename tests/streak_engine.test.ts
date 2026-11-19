import { describe, expect, it } from 'vitest';
import { addDays } from '../src/core/day_key';
import { FREEZE_EARN_EVERY_DAYS, SPORT_DAY_MIN_SESSIONS, computeStreak, getFreezeCap, getStreakBreak, isDayKept } from '../src/core/streak_engine';
import type { DayRecord } from '../src/core/types';

const START = '2026-01-01';

function record(day_key: string, completed_count: number, extra: Partial<DayRecord> = {}): DayRecord
{
    return {
        day_key,
        goal: 4,
        completed_count,
        is_sport_day: false,
        sport_checked_in: false,
        sport_activity: null,
        ...extra,
    };
}

// Days from START: "K" kept, "M" missed (no record), "P" partial (1 of 4)
function history(pattern: string): DayRecord[]
{
    const records: DayRecord[] = [];
    [...pattern].forEach((symbol, index) =>
    {
        const day = addDays(START, index);
        if (symbol === 'K')
        {
            records.push(record(day, 4));
        }
        else if (symbol === 'P')
        {
            records.push(record(day, 1));
        }
    });
    return records;
}

// "today" = the day right after the pattern, still pending
function todayAfter(pattern: string): string
{
    return addDays(START, pattern.length);
}

describe('isDayKept', () =>
{
    it('needs the full goal on a normal day', () =>
    {
        expect(isDayKept(record(START, 3))).toBe(false);
        expect(isDayKept(record(START, 4))).toBe(true);
    });

    it('needs a check-in plus one session on a sport day', () =>
    {
        const sport = { is_sport_day: true, sport_checked_in: true, sport_activity: 'home_workout' as const };
        expect(isDayKept(record(START, 1, sport))).toBe(true);
        expect(isDayKept(record(START, 0, sport))).toBe(false);
        expect(isDayKept(record(START, 1, { is_sport_day: true }))).toBe(false);
    });

    it('does not accept a sport check-in on a normal day', () =>
    {
        expect(isDayKept(record(START, 1, { sport_checked_in: true }))).toBe(false);
    });
});

describe('agreed streak numbers', () =>
{
    it('matches the plan', () =>
    {
        expect(FREEZE_EARN_EVERY_DAYS).toBe(7);
        expect(SPORT_DAY_MIN_SESSIONS).toBe(1);
    });
});

describe('getFreezeCap', () =>
{
    it.each([[0, 2], [29, 2], [30, 3], [99, 3], [100, 4], [179, 4], [180, 5], [999, 5]])('streak %i -> cap %i', (streak, cap) =>
    {
        expect(getFreezeCap(streak)).toBe(cap);
    });
});

describe('computeStreak', () =>
{
    it('is empty without history', () =>
    {
        expect(computeStreak([], START).current_streak).toBe(0);
    });

    it('counts consecutive kept days', () =>
    {
        const pattern = 'KKKKK';
        const state = computeStreak(history(pattern), todayAfter(pattern));
        expect(state.current_streak).toBe(5);
        expect(state.current_tier_index).toBe(1);
    });

    it('does not break the streak for an unfinished today', () =>
    {
        const pattern = 'KKK';
        const records = [...history(pattern), record(todayAfter(pattern), 1)];
        const state = computeStreak(records, todayAfter(pattern));
        expect(state.current_streak).toBe(3);
        expect(state.day_results[todayAfter(pattern)]).toBe('pending');
    });

    it('includes today once it is kept', () =>
    {
        const pattern = 'KKK';
        const records = [...history(pattern), record(todayAfter(pattern), 4)];
        expect(computeStreak(records, todayAfter(pattern)).current_streak).toBe(4);
    });

    it('resets after a missed day with no freeze', () =>
    {
        const pattern = 'KKKMKK';
        const state = computeStreak(history(pattern), todayAfter(pattern));
        expect(state.current_streak).toBe(2);
        expect(state.best_streak).toBe(3);
        expect(state.day_results[addDays(START, 3)]).toBe('missed');
    });

    it('treats a partial day as missed', () =>
    {
        const pattern = 'KKP';
        expect(computeStreak(history(pattern), todayAfter(pattern)).current_streak).toBe(0);
    });

    it('earns a freeze on day 7 and spends it on a miss', () =>
    {
        const pattern = 'KKKKKKKMKK';
        const state = computeStreak(history(pattern), todayAfter(pattern));
        expect(state.current_streak).toBe(9);      // 7 + frozen day (no growth) + 2
        expect(state.freezes_owned).toBe(0);
        expect(state.day_results[addDays(START, 7)]).toBe('frozen');
    });

    it('breaks when misses outnumber freezes', () =>
    {
        const pattern = 'KKKKKKKMMK';
        expect(computeStreak(history(pattern), todayAfter(pattern)).current_streak).toBe(1);
    });

    it('holds at most 2 freezes below 30 days', () =>
    {
        const pattern = 'K'.repeat(28);
        expect(computeStreak(history(pattern), todayAfter(pattern)).freezes_owned).toBe(2);
    });

    it('lets the freeze cap grow with the streak, up to 5', () =>
    {
        expect(computeStreak(history('K'.repeat(35)), todayAfter('K'.repeat(35))).freezes_owned).toBe(3);
        expect(computeStreak(history('K'.repeat(105)), todayAfter('K'.repeat(105))).freezes_owned).toBe(4);
        expect(computeStreak(history('K'.repeat(400)), todayAfter('K'.repeat(400))).freezes_owned).toBe(5);
    });

    it('cuts extra freezes back to 2 after the streak is lost', () =>
    {
        // 105 days -> 4 freezes; 5 misses burn 4 freezes, then the 5th resets
        const pattern = 'K'.repeat(105) + 'MMMMM' + 'K';
        const state = computeStreak(history(pattern), todayAfter(pattern));
        expect(state.current_streak).toBe(1);
        expect(state.freezes_owned).toBe(0);
        expect(state.best_streak).toBe(105);
    });

    it('reaches the top tier after a year', () =>
    {
        const pattern = 'K'.repeat(365);
        expect(computeStreak(history(pattern), todayAfter(pattern)).current_tier_index).toBe(8);
    });
});

// Every day of a pattern gets a record (like buildDayRecords): "K" kept, "M" nothing done
function fullHistory(pattern: string): DayRecord[]
{
    return [...pattern].map((symbol, index) => record(addDays(START, index), symbol === 'K' ? 4 : 0));
}

describe('getStreakBreak', () =>
{
    it('finds the streak lost to the miss yesterday', () =>
    {
        const pattern = 'KKKM';
        expect(getStreakBreak(fullHistory(pattern), todayAfter(pattern))).toEqual({ break_day: addDays(START, 3), lost_streak: 3 });
    });

    it('goes back over several missed days to the day the flame went out', () =>
    {
        const pattern = 'KKMMM';
        expect(getStreakBreak(fullHistory(pattern), todayAfter(pattern))).toEqual({ break_day: addDays(START, 2), lost_streak: 2 });
    });

    it('is null when yesterday was kept or frozen, or nothing was lost', () =>
    {
        expect(getStreakBreak(fullHistory('KKK'), todayAfter('KKK'))).toBeNull();
        expect(getStreakBreak(fullHistory('KKKKKKKM'), todayAfter('KKKKKKKM'))).toBeNull();   // the freeze saved it
        expect(getStreakBreak(fullHistory('M'), todayAfter('M'))).toBeNull();                 // empty first day
    });
});
