import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import type { SessionStatus } from '../../core/session_rules';
import { useFocusStore } from '../../stores/focus_store';
import { useFocusGuard } from './use_focus_guard';
import { useWakeLock } from './use_wake_lock';
import { SessionRunning } from './session_running';
import { SessionNote } from './session_note';
import { SessionDone } from './session_done';
import { SessionBroken } from './session_broken';
import styles from './focus_session.module.css';

// Full-screen layer above the whole app while a session exists.
// Shows the screen for the current status and plays the sound for each change.

const TIME_UP_RINGS = 3;
const TIME_UP_RING_GAP_MS = 1400;

export function FocusSessionLayer()
{
    const session = useFocusStore((state) => state.session);
    const status = session?.status ?? null;
    const previous_status = useRef<SessionStatus | null>(status);

    useFocusGuard();
    useWakeLock(status === 'running');

    useEffect(() =>
    {
        const previous = previous_status.current;
        previous_status.current = status;
        if (previous !== 'running' || status === 'running')
        {
            return;
        }
        if (status === 'awaiting_note')
        {
            // Time is up: ring a few times so it is heard from across the room
            for (let ring = 0; ring < TIME_UP_RINGS; ring++)
            {
                window.setTimeout(() => playSfx('chime', 1.3), ring * TIME_UP_RING_GAP_MS);
            }
        }
        else if (status === 'broken')
        {
            playSfx('crack');
            triggerHaptic();
        }
    }, [status]);

    useEffect(() =>
    {
        if (status === 'completed')
        {
            playSfx('sparkle');
        }
    }, [status]);

    return (
        <AnimatePresence>
            {session && (
                <motion.div
                    key="focus-session"
                    className={status === 'running' ? `${styles.layer} ${styles.layer_dark}` : styles.layer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    {status === 'running' && <SessionRunning session={session} />}
                    {status === 'awaiting_note' && <SessionNote />}
                    {status === 'completed' && <SessionDone />}
                    {status === 'broken' && <SessionBroken reason={session.break_reason} />}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
