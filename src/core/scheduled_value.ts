import { addDays, compareDayKeys } from './day_key';
import type { DayKey } from './types';

// A setting whose changes only apply from tomorrow (daily goal, sport weekdays).
// This stops "lower the goal at 11 PM to save today's streak".
// Stored as a history of changes so past days keep the value they really had.

export interface ScheduledChange<Value>
{
    effective_day_key: DayKey;   // first day the value applies
    value: Value;
}

export type Schedule<Value> = ScheduledChange<Value>[];

export function createSchedule<Value>(initial_value: Value, first_day_key: DayKey): Schedule<Value>
{
    return [{ effective_day_key: first_day_key, value: initial_value }];
}

// Value in force on `day_key`: the latest change that started on or before it
export function getValueForDay<Value>(schedule: Schedule<Value>, day_key: DayKey): Value
{
    let current = schedule[0].value;
    for (const change of schedule)
    {
        if (compareDayKeys(change.effective_day_key, day_key) <= 0)
        {
            current = change.value;
        }
    }
    return current;
}

// Schedule a new value for tomorrow. Changing your mind twice in one day
// replaces the pending change instead of stacking them.
export function scheduleChange<Value>(schedule: Schedule<Value>, value: Value, today: DayKey): Schedule<Value>
{
    const effective_day_key = addDays(today, 1);
    const kept = schedule.filter((change) => compareDayKeys(change.effective_day_key, effective_day_key) < 0);
    return [...kept, { effective_day_key, value }];
}

// The change waiting to apply tomorrow, if any (to show "applies tomorrow" in the UI)
export function getPendingChange<Value>(schedule: Schedule<Value>, today: DayKey): ScheduledChange<Value> | null
{
    const last = schedule[schedule.length - 1];
    return compareDayKeys(last.effective_day_key, today) > 0 ? last : null;
}

// A value picked during first-time setup. With no history yet it is the
// value from the very first day (nothing to cheat); once there is history it
// waits for tomorrow like any other change.
// Picking the value already set for tomorrow changes nothing.
export function setupValue<Value>(schedule: Schedule<Value>, value: Value, first_day_key: DayKey, today: DayKey, has_history: boolean): Schedule<Value>
{
    if (!has_history)
    {
        return createSchedule(value, first_day_key);
    }
    const tomorrow_value = getValueForDay(schedule, addDays(today, 1));
    return isSameValue(tomorrow_value, value) ? schedule : scheduleChange(schedule, value, today);
}

// Values are numbers or arrays of numbers (goal, weekdays)
function isSameValue<Value>(a: Value, b: Value): boolean
{
    return JSON.stringify(a) === JSON.stringify(b);
}
