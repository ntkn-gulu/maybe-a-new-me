import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDayRecord, buildDayRecords, type DayRecordInput } from '../core/day_records';
import { createSchedule, getPendingChange, getValueForDay, scheduleChange, setupValue, type Schedule } from '../core/scheduled_value';
import { computeStreak, getDayTarget, getSessionsToKeep, getStreakBreak, isDayKept, type StreakBreak, type StreakState } from '../core/streak_engine';
import { canCheckInSport } from '../core/sport_rules';
import type { DayKey, DayRecord, SessionRecord, SportCheckIn } from '../core/types';
import { getTodayKey } from './clock';

// Long-term history: finished sessions, sport check-ins and the settings
// schedules (goal, sport weekdays). Streak and daily progress are derived
// from this with the pure core, never stored. The only extra state is the
// highest flame tier already celebrated, so each level-up is shown once, and
// the last streak break already consoled, so that card is shown once too.

export const DEFAULT_DAILY_GOAL = 2;
export const MIN_DAILY_GOAL = 1;
export const MAX_DAILY_GOAL = 12;
export const DEFAULT_SPORT_WEEKDAYS = [1, 4];     // Monday badminton, Thursday fitness

interface ProgressState
{
    first_day_key: DayKey;
    sessions: SessionRecord[];
    sport_check_ins: SportCheckIn[];
    goal_schedule: Schedule<number>;
    sport_weekday_schedule: Schedule<number[]>;
    celebrated_tier_index: number;
    consoled_break_day: DayKey | null;    // the last streak break the "flame went out" card was shown for

    addSession: (record: SessionRecord) => void;
    setDailyGoal: (goal: number, today: DayKey) => void;
    setSportWeekdays: (weekdays: number[], today: DayKey) => void;
    applyStartingSetup: (goal: number, weekdays: number[], today: DayKey) => void;
    checkInSport: (check_in: SportCheckIn) => void;
    setCelebratedTier: (tier_index: number) => void;
    setConsoledBreak: (break_day: DayKey) => void;
}

export const PROGRESS_STORAGE_KEY = 'mnm-progress';

function createInitialHistory(today: DayKey)
{
    return {
        first_day_key: today,
        sessions: [] as SessionRecord[],
        sport_check_ins: [] as SportCheckIn[],
        goal_schedule: createSchedule(DEFAULT_DAILY_GOAL, today),
        sport_weekday_schedule: createSchedule(DEFAULT_SPORT_WEEKDAYS, today),
        celebrated_tier_index: 0,
        consoled_break_day: null as DayKey | null,
    };
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set) => ({
            ...createInitialHistory(getTodayKey()),

            addSession: (record) => set((state) => ({ sessions: [...state.sessions, record] })),

            setDailyGoal: (goal, today) => set((state) =>
            {
                return { goal_schedule: scheduleChange(state.goal_schedule, clampGoal(goal), today) };
            }),

            // Sport weekdays (0 = Sunday ... 6 = Saturday), from tomorrow like the goal
            setSportWeekdays: (weekdays, today) => set((state) => ({
                sport_weekday_schedule: scheduleChange(state.sport_weekday_schedule, normalizeWeekdays(weekdays), today),
            })),

            // Onboarding: goal and sport days apply from the first day while
            // there is no history yet, otherwise from tomorrow
            applyStartingSetup: (goal, weekdays, today) => set((state) =>
            {
                const has_history = state.sessions.length > 0 || state.sport_check_ins.length > 0;
                return {
                    goal_schedule: setupValue(state.goal_schedule, clampGoal(goal), state.first_day_key, today, has_history),
                    sport_weekday_schedule: setupValue(state.sport_weekday_schedule, normalizeWeekdays(weekdays), state.first_day_key, today, has_history),
                };
            }),

            // Ignored unless that day is a sport day without a check-in yet
            checkInSport: (check_in) => set((state) =>
            {
                const record = buildDayRecord(toInput(state, check_in.day_key), check_in.day_key);
                if (!canCheckInSport(record))
                {
                    return {};
                }
                return { sport_check_ins: [...state.sport_check_ins, check_in] };
            }),

            setCelebratedTier: (tier_index) => set({ celebrated_tier_index: tier_index }),
            setConsoledBreak: (break_day) => set({ consoled_break_day: break_day }),
        }),
        { name: PROGRESS_STORAGE_KEY },
    ),
);

// The streak counts from the day the app is first opened (a day with nothing
// done is a miss once it is over). persist only saves on the first change,
// so save the fresh history now: the first day must not move to a later day
// if the app is closed before anything happens.
if (localStorage.getItem(PROGRESS_STORAGE_KEY) === null)
{
    useProgressStore.setState({});
}

function clampGoal(goal: number): number
{
    return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(goal)));
}

// Unique weekdays 0..6, sorted
function normalizeWeekdays(weekdays: number[]): number[]
{
    return [...new Set(weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
}

type HistoryFields = Pick<ProgressState,
    'first_day_key' | 'sessions' | 'sport_check_ins' | 'goal_schedule' | 'sport_weekday_schedule'>;

function toInput(state: HistoryFields, today: DayKey): DayRecordInput
{
    return {
        first_day_key: state.first_day_key,
        today,
        sessions: state.sessions,
        sport_check_ins: state.sport_check_ins,
        goal_schedule: state.goal_schedule,
        sport_weekday_schedule: state.sport_weekday_schedule,
    };
}

// ---------- Read helpers (work outside React too) ----------

export function getTodayRecord(today: DayKey = getTodayKey()): DayRecord
{
    return buildDayRecord(toInput(useProgressStore.getState(), today), today);
}

// ---------- React hooks ----------

// Day records from the first day to today; recomputed only when history changes
export function useDayRecords(): DayRecord[]
{
    const sessions = useProgressStore((state) => state.sessions);
    const sport_check_ins = useProgressStore((state) => state.sport_check_ins);
    const goal_schedule = useProgressStore((state) => state.goal_schedule);
    const sport_weekday_schedule = useProgressStore((state) => state.sport_weekday_schedule);
    const first_day_key = useProgressStore((state) => state.first_day_key);
    const today = getTodayKey();

    return useMemo(
        () => buildDayRecords(toInput({ first_day_key, sessions, sport_check_ins, goal_schedule, sport_weekday_schedule }, today)),
        [first_day_key, today, sessions, sport_check_ins, goal_schedule, sport_weekday_schedule],
    );
}

export interface TodayProgress
{
    today: DayKey;
    done: number;
    goal: number;
    target: number;                           // sessions that keep today (goal, or 1 on a checked-in sport day)
    is_kept: boolean;
    sessions_to_keep: number;                 // 0 once kept; 1 on a checked-in sport day
    is_sport_day: boolean;
    sport_check_in: SportCheckIn | null;
}

export function useTodayProgress(): TodayProgress
{
    const records = useDayRecords();
    const sport_check_ins = useProgressStore((state) => state.sport_check_ins);
    const record = records[records.length - 1];

    return useMemo(() => ({
        today: record.day_key,
        done: record.completed_count,
        goal: record.goal,
        target: getDayTarget(record),
        is_kept: isDayKept(record),
        sessions_to_keep: getSessionsToKeep(record),
        is_sport_day: record.is_sport_day,
        sport_check_in: sport_check_ins.find((entry) => entry.day_key === record.day_key) ?? null,
    }), [record, sport_check_ins]);
}

export function useStreak(): StreakState
{
    const records = useDayRecords();
    const today = getTodayKey();
    return useMemo(() => computeStreak(records, today), [records, today]);
}

// The streak broken right now (yesterday was a miss), or null
export function useStreakBreak(): StreakBreak | null
{
    const records = useDayRecords();
    const today = getTodayKey();
    return useMemo(() => getStreakBreak(records, today), [records, today]);
}

export interface GoalSetting
{
    today_goal: number;
    tomorrow_goal: number;      // equals today_goal when nothing is pending
}

export function useGoalSetting(): GoalSetting
{
    const goal_schedule = useProgressStore((state) => state.goal_schedule);
    const today = getTodayKey();
    const today_goal = getValueForDay(goal_schedule, today);
    const pending = getPendingChange(goal_schedule, today);
    return { today_goal, tomorrow_goal: pending ? pending.value : today_goal };
}

export interface SportWeekdaySetting
{
    today_weekdays: number[];
    tomorrow_weekdays: number[];      // equals today_weekdays when nothing is pending
}

export function useSportWeekdaySetting(): SportWeekdaySetting
{
    const schedule = useProgressStore((state) => state.sport_weekday_schedule);
    const today = getTodayKey();
    const today_weekdays = getValueForDay(schedule, today);
    const pending = getPendingChange(schedule, today);
    return { today_weekdays, tomorrow_weekdays: pending ? pending.value : today_weekdays };
}
