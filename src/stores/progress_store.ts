import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildDayRecord, buildDayRecords, type DayRecordInput } from '../core/day_records';
import { createSchedule, getPendingChange, getValueForDay, scheduleChange, type Schedule } from '../core/scheduled_value';
import { computeStreak, isDayKept, type StreakState } from '../core/streak_engine';
import type { DayKey, DayRecord, SessionRecord, SportCheckIn } from '../core/types';
import { getTodayKey } from './clock';

// Long-term history: finished sessions, sport check-ins and the settings
// schedules (goal, sport weekdays). Streak and daily progress are derived
// from this with the pure core, never stored.

export const DEFAULT_DAILY_GOAL = 4;
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

    addSession: (record: SessionRecord) => void;
    setDailyGoal: (goal: number, today: DayKey) => void;
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
        }),
        { name: PROGRESS_STORAGE_KEY },
    ),
);

function toInput(state: ProgressState, today: DayKey): DayRecordInput
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

export interface TodayProgress
{
    today: DayKey;
    done: number;
    goal: number;
    is_kept: boolean;
    is_sport_day: boolean;
}

export function useTodayProgress(): TodayProgress
{
    const sessions = useProgressStore((state) => state.sessions);
    const sport_check_ins = useProgressStore((state) => state.sport_check_ins);
    const goal_schedule = useProgressStore((state) => state.goal_schedule);
    const sport_weekday_schedule = useProgressStore((state) => state.sport_weekday_schedule);
    const first_day_key = useProgressStore((state) => state.first_day_key);
    const today = getTodayKey();

    return useMemo(() =>
    {
        const record = buildDayRecord(
            { first_day_key, today, sessions, sport_check_ins, goal_schedule, sport_weekday_schedule },
            today,
        );
        return {
            today,
            done: record.completed_count,
            goal: record.goal,
            is_kept: isDayKept(record),
            is_sport_day: record.is_sport_day,
        };
    }, [first_day_key, today, sessions, sport_check_ins, goal_schedule, sport_weekday_schedule]);
}

export function useStreak(): StreakState
{
    const state = useProgressStore();
    const today = getTodayKey();
    return useMemo(
        () => computeStreak(buildDayRecords(toInput(state, today)), today),
        // Recompute only when history changes or the day rolls over
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state.sessions, state.sport_check_ins, state.goal_schedule, state.sport_weekday_schedule, state.first_day_key, today],
    );
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
