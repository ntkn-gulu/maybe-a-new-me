import type { Device, FocusLength, RandomFn } from './types';

// Anti-cheat rules for one focus session, written as a pure state machine.
// The UI feeds it events (tick, hidden, visible, answer) with the current
// time; it returns the next state. No timers or browser APIs in here.

export const FOCUS_LENGTHS: readonly FocusLength[] = [25, 50];

// Phone only: one trip out of the app may last this long (reply to a message)
export const LEAVE_GRACE_SECONDS = 60;
// Phone only: total time away allowed per 25 focus minutes
export const MAX_AWAY_SECONDS_PER_25_MIN = 180;
// "Still there?" checks per 25 minutes (desktop gets more: it has no leave rule)
export const PRESENCE_CHECKS_PER_25_MIN: Record<Device, number> = { phone: 1, desktop: 2 };
// Time to answer a "Still there?" check
export const PRESENCE_RESPONSE_SECONDS = 90;
// Checks never land in the first/last minutes of their window
export const PRESENCE_EDGE_MARGIN_SECONDS = 180;
// Clock moving back by more than this means the device time was changed
export const CLOCK_JUMP_TOLERANCE_SECONDS = 5;
// Minimum length of the "what did you do?" note
export const MIN_NOTE_LENGTH = 5;

const MS_PER_SECOND = 1000;
const SECONDS_PER_BLOCK = 25 * 60;

export type SessionStatus = 'running' | 'awaiting_note' | 'completed' | 'broken';
export type BreakReason = 'left_app' | 'away_too_long' | 'missed_check' | 'clock_jump' | 'gave_up';

export interface PresenceCheck
{
    due_at_second: number;      // seconds after start when the check pops up
    answered: boolean;
}

export interface FocusGuardState
{
    started_at: number;         // epoch ms
    planned_minutes: FocusLength;
    device: Device;
    status: SessionStatus;
    break_reason: BreakReason | null;
    away_since: number | null;  // epoch ms when the app was hidden (phone)
    total_away_ms: number;
    presence_checks: PresenceCheck[];
    last_seen_at: number;       // latest time seen, to detect clock changes
    note: string;
}

// Random check times: within each 25-minute block, `checks_per_block`
// evenly spaced windows, each check at a random point inside its window.
export function planPresenceChecks(planned_minutes: FocusLength, device: Device, random: RandomFn): number[]
{
    const blocks = planned_minutes / 25;
    const checks_per_block = PRESENCE_CHECKS_PER_25_MIN[device];
    const window_seconds = SECONDS_PER_BLOCK / checks_per_block;
    const due_seconds: number[] = [];

    for (let block = 0; block < blocks; block++)
    {
        for (let slot = 0; slot < checks_per_block; slot++)
        {
            const window_start = block * SECONDS_PER_BLOCK + slot * window_seconds;
            // Keep checks away from the very start and very end of the session
            const margin = Math.min(PRESENCE_EDGE_MARGIN_SECONDS, window_seconds / 4);
            const usable = window_seconds - 2 * margin;
            due_seconds.push(Math.round(window_start + margin + random() * usable));
        }
    }
    return due_seconds;
}

export function startSession(now: number, planned_minutes: FocusLength, device: Device, random: RandomFn): FocusGuardState
{
    return {
        started_at: now,
        planned_minutes,
        device,
        status: 'running',
        break_reason: null,
        away_since: null,
        total_away_ms: 0,
        presence_checks: planPresenceChecks(planned_minutes, device, random).map((due_at_second) => ({ due_at_second, answered: false })),
        last_seen_at: now,
        note: '',
    };
}

function breakSession(state: FocusGuardState, reason: BreakReason, now: number): FocusGuardState
{
    return { ...state, status: 'broken', break_reason: reason, away_since: null, last_seen_at: Math.max(state.last_seen_at, now) };
}

export function getElapsedSeconds(state: FocusGuardState, now: number): number
{
    return Math.max(0, (now - state.started_at) / MS_PER_SECOND);
}

export function getRemainingSeconds(state: FocusGuardState, now: number): number
{
    return Math.max(0, state.planned_minutes * 60 - getElapsedSeconds(state, now));
}

export function getMaxAwayMs(planned_minutes: FocusLength): number
{
    return (planned_minutes / 25) * MAX_AWAY_SECONDS_PER_25_MIN * MS_PER_SECOND;
}

// The check currently waiting for an answer, if any
export function getOpenPresenceCheck(state: FocusGuardState, now: number): PresenceCheck | null
{
    if (state.status !== 'running')
    {
        return null;
    }
    const elapsed = getElapsedSeconds(state, now);
    return state.presence_checks.find((check) => !check.answered && elapsed >= check.due_at_second) ?? null;
}

// Call often (e.g. every second) and on any event. Detects clock changes,
// missed checks and the end of the session.
export function tickSession(state: FocusGuardState, now: number): FocusGuardState
{
    if (state.status !== 'running')
    {
        return state;
    }
    if (now < state.last_seen_at - CLOCK_JUMP_TOLERANCE_SECONDS * MS_PER_SECOND)
    {
        return breakSession(state, 'clock_jump', now);
    }

    const elapsed = getElapsedSeconds(state, now);
    const missed = state.presence_checks.some((check) => !check.answered && elapsed >= check.due_at_second + PRESENCE_RESPONSE_SECONDS);
    if (missed)
    {
        return breakSession(state, 'missed_check', now);
    }

    const next = { ...state, last_seen_at: Math.max(state.last_seen_at, now) };
    if (elapsed >= state.planned_minutes * 60 && state.away_since === null)
    {
        return { ...next, status: 'awaiting_note' };
    }
    return next;
}

// App went to the background. Only phones are strict about this.
export function onAppHidden(state: FocusGuardState, now: number): FocusGuardState
{
    const ticked = tickSession(state, now);
    if (ticked.status !== 'running' || ticked.device !== 'phone' || ticked.away_since !== null)
    {
        return ticked;
    }
    return { ...ticked, away_since: now };
}

// App came back. Judge how long we were gone.
export function onAppVisible(state: FocusGuardState, now: number): FocusGuardState
{
    if (state.status !== 'running' || state.away_since === null)
    {
        return tickSession(state, now);
    }
    if (now < state.away_since - CLOCK_JUMP_TOLERANCE_SECONDS * MS_PER_SECOND)
    {
        return breakSession(state, 'clock_jump', now);
    }

    const away_ms = now - state.away_since;
    const total_away_ms = state.total_away_ms + away_ms;
    if (away_ms > LEAVE_GRACE_SECONDS * MS_PER_SECOND)
    {
        return breakSession({ ...state, total_away_ms }, 'left_app', now);
    }
    if (total_away_ms > getMaxAwayMs(state.planned_minutes))
    {
        return breakSession({ ...state, total_away_ms }, 'away_too_long', now);
    }
    return tickSession({ ...state, away_since: null, total_away_ms }, now);
}

// "Still there?" answered. Checks are re-validated first, so a late tap
// after the deadline does not rescue the session.
export function answerPresenceCheck(state: FocusGuardState, now: number): FocusGuardState
{
    const ticked = tickSession(state, now);
    const open_check = getOpenPresenceCheck(ticked, now);
    if (!open_check)
    {
        return ticked;
    }
    return {
        ...ticked,
        presence_checks: ticked.presence_checks.map((check) => (check === open_check ? { ...check, answered: true } : check)),
    };
}

export function giveUpSession(state: FocusGuardState, now: number): FocusGuardState
{
    return state.status === 'running' ? breakSession(state, 'gave_up', now) : state;
}

export function isNoteValid(note: string): boolean
{
    return note.trim().length >= MIN_NOTE_LENGTH;
}

// Final step: the time is up and the note is long enough -> completed
export function completeSession(state: FocusGuardState, note: string, now: number): FocusGuardState
{
    const ticked = tickSession(state, now);
    if (ticked.status !== 'awaiting_note' || !isNoteValid(note))
    {
        return ticked;
    }
    return { ...ticked, status: 'completed', note: note.trim() };
}
