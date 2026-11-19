import { addDays, compareDayKeys } from './day_key';
import { getTierForStreak } from './flame_tiers';
import type { DayKey, DayRecord, DayResult } from './types';

// Streak rules. The whole streak is recomputed from day history every time:
// simple, never drifts, and fast enough for years of data.

// Sessions needed on a sport day once the workout is checked in
export const SPORT_DAY_MIN_SESSIONS = 1;

// A freeze is earned every N kept days in a row
export const FREEZE_EARN_EVERY_DAYS = 7;

// How many freezes can be held, by current streak length (sorted ascending)
export const FREEZE_CAP_BY_STREAK: readonly { min_streak: number; cap: number }[] = [
    { min_streak: 0, cap: 2 },
    { min_streak: 30, cap: 3 },
    { min_streak: 100, cap: 4 },
    { min_streak: 180, cap: 5 },
];

export function getFreezeCap(streak_days: number): number
{
    let cap = FREEZE_CAP_BY_STREAK[0].cap;
    for (const step of FREEZE_CAP_BY_STREAK)
    {
        if (streak_days >= step.min_streak)
        {
            cap = step.cap;
        }
    }
    return cap;
}

// A day is kept by hitting the goal, or on a sport day by working out + a short study
export function isDayKept(record: DayRecord): boolean
{
    if (record.completed_count >= record.goal)
    {
        return true;
    }
    return record.is_sport_day && record.sport_checked_in && record.completed_count >= SPORT_DAY_MIN_SESSIONS;
}

// Valid sessions that keep this day: the goal, or only the sport minimum
// once the workout of a sport day is checked in
export function getDayTarget(record: DayRecord): number
{
    if (record.is_sport_day && record.sport_checked_in)
    {
        return Math.min(record.goal, SPORT_DAY_MIN_SESSIONS);
    }
    return record.goal;
}

// Valid sessions still needed to keep this day (0 once kept)
export function getSessionsToKeep(record: DayRecord): number
{
    if (isDayKept(record))
    {
        return 0;
    }
    return Math.max(0, getDayTarget(record) - record.completed_count);
}

export interface StreakState
{
    current_streak: number;
    best_streak: number;
    freezes_owned: number;
    current_tier_index: number;
    day_results: Record<DayKey, DayResult>;   // for the calendar heatmap
}

export const EMPTY_STREAK: StreakState = {
    current_streak: 0,
    best_streak: 0,
    freezes_owned: 0,
    current_tier_index: 0,
    day_results: {},
};

// Walk every day from the first record up to today.
// Past days without a record count as missed. Today is "pending" until kept,
// so an unfinished today never breaks the streak.
export function computeStreak(records: DayRecord[], today: DayKey): StreakState
{
    if (records.length === 0)
    {
        return { ...EMPTY_STREAK, day_results: {} };
    }

    const by_day = new Map(records.map((record) => [record.day_key, record]));
    const first_day = records.map((record) => record.day_key).sort(compareDayKeys)[0];

    let streak = 0;
    let best = 0;
    let freezes = 0;
    const day_results: Record<DayKey, DayResult> = {};

    for (let day = first_day; compareDayKeys(day, today) <= 0; day = addDays(day, 1))
    {
        const record = by_day.get(day);
        const is_kept = record !== undefined && isDayKept(record);

        if (is_kept)
        {
            streak += 1;
            best = Math.max(best, streak);
            if (streak % FREEZE_EARN_EVERY_DAYS === 0)
            {
                freezes = Math.min(getFreezeCap(streak), freezes + 1);
            }
            day_results[day] = 'kept';
        }
        else if (day === today)
        {
            day_results[day] = 'pending';
        }
        else if (freezes > 0)
        {
            freezes -= 1;               // streak survives, but does not grow
            day_results[day] = 'frozen';
        }
        else
        {
            streak = 0;
            freezes = Math.min(freezes, getFreezeCap(0));
            day_results[day] = 'missed';
        }
    }

    return {
        current_streak: streak,
        best_streak: best,
        freezes_owned: freezes,
        current_tier_index: getTierForStreak(streak).index,
        day_results,
    };
}

export interface StreakBreak
{
    break_day: DayKey;                // the first missed day (the day the flame went out)
    lost_streak: number;              // how long the streak was before it
}

// The streak that is broken right now: yesterday was a miss, and before that
// run of missed days there was a streak. Null when yesterday was not a miss
// or there was nothing to lose (e.g. an empty first day).
export function getStreakBreak(records: DayRecord[], today: DayKey): StreakBreak | null
{
    const day_results = computeStreak(records, today).day_results;
    let break_day = addDays(today, -1);
    if (day_results[break_day] !== 'missed')
    {
        return null;
    }
    while (day_results[addDays(break_day, -1)] === 'missed')
    {
        break_day = addDays(break_day, -1);
    }
    // The streak at the end of the day before the break: with history up to
    // that day, the break day itself is just a pending "today"
    const before_break = addDays(break_day, -1);
    const earlier = records.filter((record) => compareDayKeys(record.day_key, before_break) <= 0);
    const lost_streak = computeStreak(earlier, break_day).current_streak;
    return lost_streak > 0 ? { break_day, lost_streak } : null;
}
