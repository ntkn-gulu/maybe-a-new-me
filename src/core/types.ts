// Shared data types for the game rules. Pure data, no behavior.

// An "app day" written as YYYY-MM-DD. App days start at 4 AM (see day_key.ts).
export type DayKey = string;

// Random source in [0, 1). Passed in so rules stay deterministic in tests.
export type RandomFn = () => number;

export type Device = 'phone' | 'desktop';

export type FocusLength = 25 | 50;

export type SportActivity = 'badminton' | 'gym' | 'home_workout' | 'running' | 'other';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type ChestType = 'daily' | 'silver' | 'milestone';

export type ItemSlot = 'flame' | 'timer_skin' | 'sound_pack' | 'theme' | 'title';

// Everything the streak engine needs to know about one day
export interface DayRecord
{
    day_key: DayKey;
    goal: number;                       // pomodoro goal that applied on this day
    completed_count: number;            // valid sessions only
    is_sport_day: boolean;
    sport_checked_in: boolean;
    sport_activity: SportActivity | null;
}

export type DayResult = 'kept' | 'frozen' | 'missed' | 'pending';

export interface PityState
{
    since_epic: number;                 // chests opened since the last epic-or-better
    since_legendary: number;            // chests opened since the last legendary
}
