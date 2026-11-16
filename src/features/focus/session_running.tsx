import { AnimatePresence, motion } from 'motion/react';
import { HoldButton } from '../../ui/hold_button';
import { isAudioStale, playSfx, unlockAudio } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import { getMaxAwayMs, getOpenPresenceCheck, getRemainingSeconds, PRESENCE_CHECKS_PER_25_MIN, type FocusGuardState } from '../../core/session_rules';
import { getSessionNow, useFocusStore } from '../../stores/focus_store';
import { formatClock } from './format_time';
import { PresenceCheck } from './presence_check';
import styles from './focus_session.module.css';

// The screen while a session runs: pure black (cheap on OLED, the screen
// stays on the whole time), a big countdown and a thin progress ring.

const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface SessionRunningProps
{
    session: FocusGuardState;
}

export function SessionRunning(props: SessionRunningProps)
{
    const t = useT();
    // Separate selectors: an object selector would re-render forever in Zustand 5
    const clock_origin = useFocusStore((state) => state.clock_origin);
    const time_scale = useFocusStore((state) => state.time_scale);
    const giveUp = useFocusStore((state) => state.giveUp);
    const clock = { clock_origin, time_scale };

    const now = getSessionNow(clock);
    const total_seconds = props.session.planned_minutes * 60;
    const remaining = getRemainingSeconds(props.session, now);
    const progress = 1 - remaining / total_seconds;
    const open_check = getOpenPresenceCheck(props.session, now);
    const away_left_seconds = (getMaxAwayMs(props.session.planned_minutes, props.session.limit_scale) - props.session.total_away_ms) / 1000 / props.session.limit_scale;
    const checks_count = (props.session.planned_minutes / 25) * PRESENCE_CHECKS_PER_25_MIN.desktop;
    // Re-read every tick: after returning from the background, sound needs one tap
    const is_sound_stale = isAudioStale();

    // Any tap on the running screen rebuilds the audio (must happen inside a tap on iOS)
    function handleTap(): void
    {
        if (isAudioStale())
        {
            unlockAudio();
            playSfx('tick');
        }
    }

    return (
        <div className={styles.running} onClick={handleTap}>
            {is_sound_stale && (
                <motion.div
                    className={styles.sound_banner}
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: [0.6, 1, 0.6] }}
                    transition={{ y: { duration: 0.2 }, opacity: { duration: 1.6, repeat: Infinity } }}
                >
                    🔈 {t('focus_tap_for_sound')}
                </motion.div>
            )}
            <div className={styles.running_top}>
                <span className={styles.running_label}>{t('focus_running_label', { n: props.session.planned_minutes })}</span>
                {clock.time_scale > 1 && <span className={styles.dev_chip}>{t('focus_dev_chip', { n: clock.time_scale })}</span>}
            </div>

            <div className={styles.running_center}>
                <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r={RING_RADIUS} className={styles.ring_track} />
                    <circle
                        cx="50"
                        cy="50"
                        r={RING_RADIUS}
                        className={styles.ring_progress}
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
                    />
                </svg>
                <span className={styles.running_time}>{formatClock(remaining)}</span>
            </div>

            <div className={styles.running_bottom}>
                <span className={styles.running_info}>
                    {props.session.device === 'phone'
                        ? t('focus_away_left', { time: formatClock(away_left_seconds) })
                        : t('focus_desktop_mode', { n: checks_count })}
                </span>
                {props.session.device === 'phone' && <p className={styles.running_hint}>{t('focus_leave_hint')}</p>}
                <HoldButton label={t('focus_hold_give_up')} onConfirm={giveUp} />
            </div>

            <AnimatePresence>
                {open_check && (
                    <motion.div
                        key={open_check.due_at_second}
                        className={styles.presence_layer}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <PresenceCheck due_at_second={open_check.due_at_second} session={props.session} now={now} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
