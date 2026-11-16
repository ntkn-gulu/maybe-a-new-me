import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    answerPresenceCheck,
    completeSession,
    giveUpSession,
    onAppHidden,
    onAppVisible,
    startSession,
    tickSession,
    type FocusGuardState,
} from '../core/session_rules';
import type { Device, FocusLength, SessionRecord } from '../core/types';
import { createId, getDayKeyAt } from './clock';
import { useProgressStore } from './progress_store';

// The session in progress. Every event goes through the pure state machine
// in core/session_rules; this store only adds the clock, persistence (so a
// reload mid-session is judged fairly) and writing finished sessions to history.

// Dev mode speed-up: 25 minutes pass in 1 real minute
export const DEV_TIME_SCALE = 25;

interface FocusState
{
    selected_length: FocusLength;
    session: FocusGuardState | null;
    clock_origin: number;       // real epoch ms when the session started
    time_scale: number;         // 1 normally, DEV_TIME_SCALE in dev mode

    setSelectedLength: (length: FocusLength) => void;
    start: (device: Device, is_dev_mode: boolean) => void;
    tick: () => void;
    appHidden: () => void;
    appVisible: () => void;
    answerCheck: () => void;
    giveUp: () => void;
    submitNote: (note: string) => boolean;
    dismiss: () => void;
    recoverAfterReload: () => void;
}

const FOCUS_STORAGE_KEY = 'mnm-focus';

// Session time: real time, sped up in dev mode
export function getSessionNow(state: Pick<FocusState, 'clock_origin' | 'time_scale'>): number
{
    const real_now = Date.now();
    return state.clock_origin + (real_now - state.clock_origin) * state.time_scale;
}

function toRecord(session: FocusGuardState, ended_at: number): SessionRecord
{
    return {
        id: createId(),
        day_key: getDayKeyAt(session.started_at),
        started_at: session.started_at,
        ended_at,
        planned_minutes: session.planned_minutes,
        device: session.device,
        status: session.status === 'completed' ? 'completed' : 'broken',
        break_reason: session.break_reason,
        note: session.note,
    };
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set, get) =>
        {
            // Apply a state-machine step; log the session the moment it breaks
            function apply(step: (session: FocusGuardState, now: number) => FocusGuardState): void
            {
                const { session } = get();
                if (!session)
                {
                    return;
                }
                const now = getSessionNow(get());
                const next = step(session, now);
                if (next === session)
                {
                    return;
                }
                if (session.status !== 'broken' && next.status === 'broken')
                {
                    useProgressStore.getState().addSession(toRecord(next, now));
                }
                set({ session: next });
            }

            return {
                selected_length: 25,
                session: null,
                clock_origin: 0,
                time_scale: 1,

                setSelectedLength: (length) => set({ selected_length: length }),

                start: (device, is_dev_mode) =>
                {
                    const clock_origin = Date.now();
                    const time_scale = is_dev_mode ? DEV_TIME_SCALE : 1;
                    set({
                        clock_origin,
                        time_scale,
                        // Limits scale with the clock, so dev mode still gives 90 real seconds to answer
                        session: startSession(clock_origin, get().selected_length, device, Math.random, time_scale),
                    });
                },

                tick: () => apply(tickSession),
                appHidden: () => apply(onAppHidden),
                appVisible: () => apply(onAppVisible),
                answerCheck: () => apply(answerPresenceCheck),
                giveUp: () => apply(giveUpSession),

                // Returns true when the session was saved as completed
                submitNote: (note) =>
                {
                    const { session } = get();
                    if (!session)
                    {
                        return false;
                    }
                    const now = getSessionNow(get());
                    const next = completeSession(session, note, now);
                    set({ session: next });
                    if (next.status === 'completed' && session.status !== 'completed')
                    {
                        useProgressStore.getState().addSession(toRecord(next, now));
                        return true;
                    }
                    return false;
                },

                dismiss: () => set({ session: null }),

                // App was closed or reloaded while running: on a phone, the time it
                // was closed counts as time away from the app.
                recoverAfterReload: () =>
                {
                    const { session } = get();
                    if (!session || session.status !== 'running')
                    {
                        return;
                    }
                    if (session.device === 'phone' && session.away_since === null)
                    {
                        apply((current) => onAppHidden(current, current.last_seen_at));
                    }
                    apply(onAppVisible);
                },
            };
        },
        {
            name: FOCUS_STORAGE_KEY,
            // Sessions saved by older versions have no limit_scale: treat it as 1
            merge: (persisted, current) =>
            {
                const saved = (persisted ?? {}) as Partial<FocusState>;
                const session = saved.session ? { ...saved.session, limit_scale: saved.session.limit_scale ?? 1 } : null;
                return { ...current, ...saved, session };
            },
            partialize: (state) => ({
                selected_length: state.selected_length,
                session: state.session,
                clock_origin: state.clock_origin,
                time_scale: state.time_scale,
            }),
        },
    ),
);
