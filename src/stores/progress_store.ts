import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDayRecord, buildDayRecords, type DayRecordInput } from '../core/day_records';
import { createSchedule, getPendingChange, getValueForDay, scheduleChange, type Schedule } from '../core/scheduled_value';
import { computeStreak, getDayTarget, getSessionsToKeep, isDayKept, type StreakState } from '../core/streak_engine';
import { canCheckInSport } from '../core/sport_rules';
import type { DayKey, DayRecord, SessionRecord, SportCheckIn } from '../core/types';
import { getTodayKey } from './clock';

// Long-term history: finished sessions, sport check-ins and the settings
// schedules (goal, sport weekdays). Streak and daily progress are derived
// from this with the pure core, never stored. The only extra state is the
// highest flame tier already celebrated, so each level-up is shown once.

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

    addSession: (record: SessionRecord) => void;
    setDailyGoal: (goal: number, today: DayKey) => void;
    checkInSport: (check_in: SportCheckIn) => void;
    setCelebratedTier: (tier_index: number) => void;
}

const PROGRESS_STORAGE_KEY = 'mnm-progress';

function createInitialHistory(today: DayKey)
{
    return {
        first_day_key: today,
        sessions: [] as SessionRecord[],
        sport_check_ins: [] as SportCheckIn[],
        goal_schedule: createSchedule(DEFAULT_DAILY_GOAL, today),
        sport_weekday_schedule: createSchedule(DEFAULT_SPORT_WEEKDAYS, today),
        celebrated_tier_index: 0,
    };
}

export const useProgressStore = create<ProgressState>()(
    persist(
        (set) => ({
            ...createInitialHistory(getTodayKey()),

            addSession: (record) => set((state) => ({ sessions: [...state.sessions, record] })),

            setDailyGoal: (goal, today) => set((state) =>
            {
                const clamped = Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(goal)));
                return { goal_schedule: scheduleChange(state.goal_schedule, clamped, today) };
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
        }),
        { name: PROGRESS_STORAGE_KEY },
    ),
);

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
