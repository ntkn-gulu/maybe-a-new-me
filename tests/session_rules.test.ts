import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/rng';
import {
    LEAVE_GRACE_SECONDS,
    MAX_AWAY_SECONDS_PER_25_MIN,
    MIN_NOTE_LENGTH,
    PRESENCE_CHECKS_PER_25_MIN,
    PRESENCE_RESPONSE_SECONDS,
    answerPresenceCheck,
    completeSession,
    getOpenPresenceCheck,
    getRemainingSeconds,
    giveUpSession,
    onAppHidden,
    onAppVisible,
    planPresenceChecks,
    startSession,
    tickSession,
    type FocusGuardState,
} from '../src/core/session_rules';
import type { Device, FocusLength } from '../src/core/types';

const T0 = Date.parse('2026-11-17T09:00:00+07:00');
const SECOND = 1000;
const MINUTE = 60 * SECOND;

function start(minutes: FocusLength = 25, device: Device = 'phone', seed = 1): FocusGuardState
{
    return startSession(T0, minutes, device, createSeededRandom(seed));
}

// Answer every check right when it appears, ticking second by second up to `until_ms`
function runHonestly(state: FocusGuardState, until_ms: number): FocusGuardState
{
    let current = state;
    for (let now = T0; now <= until_ms; now += SECOND)
    {
        current = tickSession(current, now);
        if (getOpenPresenceCheck(current, now))
        {
            current = answerPresenceCheck(current, now);
        }
    }
    return current;
}

describe('agreed strict-mode numbers', () =>
{
    // Pins the plan's rules. When tuning on purpose, update this test too.
    it('matches the plan', () =>
    {
        expect(LEAVE_GRACE_SECONDS).toBe(60);
        expect(MAX_AWAY_SECONDS_PER_25_MIN).toBe(180);
        expect(PRESENCE_RESPONSE_SECONDS).toBe(90);
        expect(PRESENCE_CHECKS_PER_25_MIN).toEqual({ phone: 1, desktop: 2 });
        expect(MIN_NOTE_LENGTH).toBe(5);
    });
});

describe('planPresenceChecks', () =>
{
    it('plans 1 check per 25 min on phone and 2 on desktop', () =>
    {
        const random = createSeededRandom(7);
        expect(planPresenceChecks(25, 'phone', random)).toHaveLength(1);
        expect(planPresenceChecks(50, 'phone', random)).toHaveLength(2);
        expect(planPresenceChecks(25, 'desktop', random)).toHaveLength(2);
        expect(planPresenceChecks(50, 'desktop', random)).toHaveLength(4);
    });

    it('keeps every deadline inside the session', () =>
    {
        for (let seed = 1; seed <= 200; seed++)
        {
            for (const minutes of [25, 50] as const)
            {
                for (const device of ['phone', 'desktop'] as const)
                {
                    const checks = planPresenceChecks(minutes, device, createSeededRandom(seed));
                    for (const due of checks)
                    {
                        expect(due).toBeGreaterThanOrEqual(180);
                        expect(due + PRESENCE_RESPONSE_SECONDS).toBeLessThan(minutes * 60);
                    }
                }
            }
        }
    });
});

describe('a session played honestly', () =>
{
    it('reaches the note step, then completes with a real note', () =>
    {
        const end = T0 + 25 * MINUTE;
        const state = runHonestly(start(), end);
        expect(state.status).toBe('awaiting_note');
        expect(getRemainingSeconds(state, end)).toBe(0);

        expect(completeSession(state, 'ok', end).status).toBe('awaiting_note');     // too short
        const done = completeSession(state, '  Ôn chương 3 Giải tích  ', end);
        expect(done.status).toBe('completed');
        expect(done.note).toBe('Ôn chương 3 Giải tích');
    });

    it('cannot be completed before time is up', () =>
    {
        const state = runHonestly(start(), T0 + 10 * MINUTE);
        expect(completeSession(state, 'Làm bài tập', T0 + 10 * MINUTE).status).toBe('running');
    });
});

describe('leaving the app (phone)', () =>
{
    it('allows a short trip to reply to a message', () =>
    {
        let state = onAppHidden(start(), T0 + MINUTE);
        state = onAppVisible(state, T0 + MINUTE + 40 * SECOND);
        expect(state.status).toBe('running');
        expect(state.total_away_ms).toBe(40 * SECOND);
    });

    it('breaks the session after more than 1 minute away', () =>
    {
        let state = onAppHidden(start(), T0 + MINUTE);
        state = onAppVisible(state, T0 + MINUTE + (LEAVE_GRACE_SECONDS + 1) * SECOND);
        expect(state.status).toBe('broken');
        expect(state.break_reason).toBe('left_app');
    });

    it('breaks the session when short trips add up past 3 minutes', () =>
    {
        let state = start();
        for (let trip = 0; trip < 4; trip++)
        {
            const leave_at = T0 + (1 + trip * 2) * MINUTE;
            state = onAppHidden(state, leave_at);
            state = onAppVisible(state, leave_at + 50 * SECOND);
        }
        expect(state.status).toBe('broken');
        expect(state.break_reason).toBe('away_too_long');
    });

    it('allows double the away time in a 50 minute session', () =>
    {
        let state = start(50);
        for (let trip = 0; trip < 4; trip++)
        {
            const leave_at = T0 + (1 + trip * 2) * MINUTE;
            state = onAppHidden(state, leave_at);
            state = onAppVisible(state, leave_at + 50 * SECOND);
        }
        expect(state.status).toBe('running');
    });

    it('does not apply the leave rule on desktop', () =>
    {
        let state = onAppHidden(start(25, 'desktop'), T0 + MINUTE);
        state = onAppVisible(state, T0 + 2 * MINUTE + 30 * SECOND);
        expect(state.status).toBe('running');
        expect(state.away_since).toBeNull();
    });
});

describe('"Still there?" checks', () =>
{
    it('breaks the session when a check is ignored', () =>
    {
        const state = start();
        const due = state.presence_checks[0].due_at_second;
        const late = tickSession(state, T0 + (due + PRESENCE_RESPONSE_SECONDS + 1) * SECOND);
        expect(late.status).toBe('broken');
        expect(late.break_reason).toBe('missed_check');
    });

    it('accepts an answer inside the 90 second window', () =>
    {
        const state = start();
        const due = state.presence_checks[0].due_at_second;
        const answered = answerPresenceCheck(state, T0 + (due + 60) * SECOND);
        expect(answered.presence_checks[0].answered).toBe(true);
        expect(tickSession(answered, T0 + (due + 200) * SECOND).status).toBe('running');
    });

    it('does not let a late tap rescue the session', () =>
    {
        const state = start();
        const due = state.presence_checks[0].due_at_second;
        const late = answerPresenceCheck(state, T0 + (due + PRESENCE_RESPONSE_SECONDS + 5) * SECOND);
        expect(late.status).toBe('broken');
    });

    it('catches a check missed while sleeping with the app open', () =>
    {
        // Fell asleep: next event only arrives at the end of the session
        const state = tickSession(start(), T0 + 25 * MINUTE);
        expect(state.break_reason).toBe('missed_check');
    });
});

describe('cheating the clock', () =>
{
    it('breaks the session when device time moves backwards', () =>
    {
        let state = tickSession(start(), T0 + 5 * MINUTE);
        state = tickSession(state, T0 + 2 * MINUTE);
        expect(state.status).toBe('broken');
        expect(state.break_reason).toBe('clock_jump');
    });

    it('ignores tiny clock corrections', () =>
    {
        let state = tickSession(start(), T0 + 5 * MINUTE);
        state = tickSession(state, T0 + 5 * MINUTE - 2 * SECOND);
        expect(state.status).toBe('running');
    });
});

describe('giving up', () =>
{
    it('marks the session broken', () =>
    {
        const state = giveUpSession(start(), T0 + MINUTE);
        expect(state.break_reason).toBe('gave_up');
    });
});
