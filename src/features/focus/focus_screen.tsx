import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { playSfx } from '../../sound/sfx_engine';
import { SPRING_POP } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { useFocusStore, DEV_TIME_SCALE } from '../../stores/focus_store';
import { useTodayProgress } from '../../stores/progress_store';
import { useSettingsStore } from '../../stores/settings_store';
import { detectDevice } from '../../stores/clock';
import type { FocusLength } from '../../core/types';
import styles from './focus_screen.module.css';

// Focus tab. A chunky kitchen-timer dial: the colored wedge shows how long
// the session is, the needle sits at its end. Start opens the session layer.
// Tapping the kicker 5 times toggles dev mode (sessions run 25x faster).

const FOCUS_LENGTHS: FocusLength[] = [25, 50];
const DEV_MODE_TAPS = 5;
const DEV_TAP_WINDOW_MS = 2000;
const DEV_TOAST_MS = 1800;
const DEGREES_PER_MINUTE = 6;          // 60 minutes = full circle
const TICK_COUNT = 60;

const RATCHET_CLICKS = 7;
const RATCHET_INTERVAL_MS = 45;

// Spring that turns the dial like a real knob (slight overshoot)
const DIAL_SPRING = { stiffness: 140, damping: 14 };

// Wedge geometry in the disc's own SVG space (viewBox 0 0 100 100).
// The radius is larger than the disc so the arc edge is hidden by the
// disc's round clip: no thin anti-aliased rim can show.
const WEDGE_CENTER = 50;
const WEDGE_RADIUS = 60;
const MAX_WEDGE_DEGREES = 359.9;       // a full 360 arc would collapse to nothing

function formatMinutes(minutes: number): string
{
    return `${String(minutes).padStart(2, '0')}:00`;
}

// SVG pie slice from 12 o'clock, clockwise, to `degrees`
function wedgePath(degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0), MAX_WEDGE_DEGREES);
    const radians = (clamped * Math.PI) / 180;
    const end_x = WEDGE_CENTER + WEDGE_RADIUS * Math.sin(radians);
    const end_y = WEDGE_CENTER - WEDGE_RADIUS * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${WEDGE_CENTER} ${WEDGE_CENTER} L ${WEDGE_CENTER} ${WEDGE_CENTER - WEDGE_RADIUS} `
        + `A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large_arc} 1 ${end_x} ${end_y} Z`;
}

export function FocusScreen()
{
    const t = useT();
    const focus_length = useFocusStore((state) => state.selected_length);
    const setFocusLength = useFocusStore((state) => state.setSelectedLength);
    const start = useFocusStore((state) => state.start);
    const is_dev_mode = useSettingsStore((state) => state.is_dev_mode);
    const toggleDevMode = useSettingsStore((state) => state.toggleDevMode);
    const today = useTodayProgress();
    const [dev_toast, setDevToast] = useState<string | null>(null);
    const kicker_taps = useRef<number[]>([]);

    const sweep_degrees = useSpring(focus_length * DEGREES_PER_MINUTE, DIAL_SPRING);
    const wedge_d = useTransform(sweep_degrees, wedgePath);

    useEffect(() =>
    {
        sweep_degrees.set(focus_length * DEGREES_PER_MINUTE);
    }, [focus_length, sweep_degrees]);

    function chooseLength(length: FocusLength): void
    {
        if (length === focus_length)
        {
            return;
        }
        setFocusLength(length);
        // Ratchet clicks while the dial turns, like winding a kitchen timer
        for (let i = 0; i < RATCHET_CLICKS; i++)
        {
            window.setTimeout(() => playSfx('tick'), i * RATCHET_INTERVAL_MS);
        }
    }

    function handleStart(): void
    {
        playSfx('whoosh');
        start(detectDevice(), is_dev_mode);
    }

    // 5 quick taps on the kicker toggle dev mode
    function handleKickerTap(): void
    {
        const now = Date.now();
        kicker_taps.current = [...kicker_taps.current.filter((time) => now - time < DEV_TAP_WINDOW_MS), now];
        if (kicker_taps.current.length < DEV_MODE_TAPS)
        {
            return;
        }
        kicker_taps.current = [];
        toggleDevMode();
        playSfx('sparkle');
        setDevToast(is_dev_mode ? t('dev_mode_off') : t('dev_mode_on', { n: DEV_TIME_SCALE }));
        window.setTimeout(() => setDevToast(null), DEV_TOAST_MS);
    }

    const kicker = today.done >= today.goal
        ? t('focus_kicker_done', { done: today.done })
        : t('focus_kicker', { n: today.done + 1, goal: today.goal });

    return (
        <Screen kicker={kicker} title={t('focus_title')} onKickerTap={handleKickerTap}>
            <div className={styles.dial}>
                <div className={styles.dial_ring}>
                    {Array.from({ length: TICK_COUNT }, (_, index) => (
                        <span
                            key={index}
                            className={index % 5 === 0 ? `${styles.tick} ${styles.tick_major}` : styles.tick}
                            style={{ transform: `rotate(${index * DEGREES_PER_MINUTE}deg)` }}
                        />
                    ))}
                </div>
                <div className={styles.dial_disc}>
                    <svg className={styles.wedge} viewBox="0 0 100 100" aria-hidden="true">
                        <motion.path d={wedge_d} className={styles.wedge_path} />
                    </svg>
                </div>
                {/* Needle layer sits outside the clipped disc. Its drop shadow is on this
                    non-rotating wrapper, so the light direction stays fixed while it turns. */}
                <div className={styles.needle_layer}>
                    <motion.div className={styles.needle} style={{ rotate: sweep_degrees }}>
                        <span className={styles.needle_bar} />
                    </motion.div>
                    <span className={styles.hub} />
                </div>
            </div>

            <div className={styles.time_row}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={focus_length}
                        className={styles.time}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        transition={SPRING_POP}
                    >
                        {formatMinutes(focus_length)}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className={styles.pips} aria-label={t('focus_pips_label', { done: today.done, goal: today.goal })}>
                {Array.from({ length: Math.max(today.goal, today.done) }, (_, index) => (
                    <span key={index} className={index < today.done ? `${styles.pip} ${styles.pip_done}` : styles.pip} />
                ))}
            </div>

            <div className={styles.length_row}>
                {FOCUS_LENGTHS.map((length) => (
                    <TactileButton
                        key={length}
                        size="sm"
                        is_selected={length === focus_length}
                        onClick={() => chooseLength(length)}
                    >
                        {t('focus_minutes', { n: length })}
                    </TactileButton>
                ))}
            </div>

            <div className={styles.start_area}>
                <TactileButton variant="accent" size="lg" is_full_width onClick={handleStart}>
                    {t('focus_start')}
                    {is_dev_mode && <span className={styles.dev_badge}>{t('focus_dev_chip', { n: DEV_TIME_SCALE })}</span>}
                </TactileButton>
                <AnimatePresence>
                    {dev_toast && (
                        <motion.p
                            className={styles.preview_note}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            {dev_toast}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </Screen>
    );
}
