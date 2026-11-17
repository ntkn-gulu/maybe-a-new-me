import type { DayRecord, SportActivity } from './types';

// Sport-day check-in rules. On a sport day the workout + a short study
// keeps the flame (see isDayKept in streak_engine.ts).

// Order shown in the check-in sheet
export const SPORT_ACTIVITIES: readonly SportActivity[] = ['badminton', 'gym', 'home_workout', 'running', 'other'];

// "What did you train today?" needs at least this many characters
export const MIN_CHECK_IN_NOTE_LENGTH = 3;

// Only on a sport day, and only once that day
export function canCheckInSport(record: DayRecord): boolean
{
    return record.is_sport_day && !record.sport_checked_in;
}

export function isCheckInNoteValid(note: string): boolean
{
    return note.trim().length >= MIN_CHECK_IN_NOTE_LENGTH;
}
