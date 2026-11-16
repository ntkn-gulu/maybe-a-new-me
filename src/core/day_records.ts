import { addDays, compareDayKeys, getWeekday } from './day_key';
import { getValueForDay, type Schedule } from './scheduled_value';
import type { DayKey, DayRecord, SessionRecord, SportCheckIn } from './types';

// Turns raw history (sessions, check-ins, settings schedules) into one
// DayRecord per day, which is what the streak engine reads.

export interface DayRecordInput
{
    first_day_key: DayKey;              // first day the app was used
    today: DayKey;
    sessions: SessionRecord[];
    sport_check_ins: SportCheckIn[];
    goal_schedule: Schedule<number>;
    sport_weekday_schedule: Schedule<number[]>;   // 0 = Sunday ... 6 = Saturday
}

export function countCompletedSessions(sessions: SessionRecord[], day_key: DayKey): number
{
    return sessions.filter((session) => session.day_key === day_key && session.status === 'completed').length;
}

export function isSportDay(sport_weekday_schedule: Schedule<number[]>, day_key: DayKey): boolean
{
    return getValueForDay(sport_weekday_schedule, day_key).includes(getWeekday(day_key));
}

export function buildDayRecord(input: DayRecordInput, day_key: DayKey): DayRecord
{
    const check_in = input.sport_check_ins.find((entry) => entry.day_key === day_key) ?? null;
    return {
        day_key,
        goal: getValueForDay(input.goal_schedule, day_key),
        completed_count: countCompletedSessions(input.sessions, day_key),
        is_sport_day: isSportDay(input.sport_weekday_schedule, day_key),
        sport_checked_in: check_in !== null,
        sport_activity: check_in?.activity ?? null,
    };
}

// Every day from the first day to today, inclusive
export function buildDayRecords(input: DayRecordInput): DayRecord[]
{
    const records: DayRecord[] = [];
    for (let day = input.first_day_key; compareDayKeys(day, input.today) <= 0; day = addDays(day, 1))
    {
        records.push(buildDayRecord(input, day));
    }
    return records;
}
