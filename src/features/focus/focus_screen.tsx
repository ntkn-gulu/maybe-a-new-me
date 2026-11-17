import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring } from 'motion/react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { playSfx } from '../../sound/sfx_engine';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { useFocusStore, DEV_TIME_SCALE } from '../../stores/focus_store';
import { useTodayProgress } from '../../stores/progress_store';
import { useSettingsStore } from '../../stores/settings_store';
import { useArtStyle } from '../../stores/active_theme';
import { detectDevice } from '../../stores/clock';
import type { FocusLength } from '../../core/types';
import { SketchTimerDial } from './sketch_timer_dial';
import { ExtrudedTimerDial } from './extruded_timer_dial';
import { ScribbleMark } from '../../ui/sketch_marks';
import styles from './focus_screen.module.css';

// Focus tab. A kitchen-timer dial (ExtrudedTimerDial in the 3D theme, SketchTimerDial in the sketch theme): the light wedge
// shows how long the session is, the needle sits at its end. Start opens the session layer.
// Tapping the kicker 5 times toggles dev mode (sessions run 25x faster).

const FOCUS_LENGTHS: FocusLength[] = [25, 50];
const DEV_MODE_TAPS = 5;
const DEV_TAP_WINDOW_MS = 2000;
const DEV_TOAST_MS = 1800;
const DEGREES_PER_MINUTE = 6;          // 60 minutes = full circle

const RATCHET_CLICKS = 7;
const RATCHET_INTERVAL_MS = 45;

// Spring that turns the dial like a real knob (slight overshoot)
const DIAL_SPRING = { stiffness: 140, damping: 14 };

function formatMinutes(minutes: number): string
{
    return `${String(minutes).padStart(2, '0')}:00`;
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
    const art_style = useArtStyle();
    const [dev_toast, setDevToast] = useState<string | null>(null);
    const kicker_taps = useRef<number[]>([]);

    const sweep_degrees = useSpring(focus_length * DEGREES_PER_MINUTE, DIAL_SPRING);

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

    const kicker = today.is_kept
        ? t('focus_kicker_done', { done: today.done })
        : t('focus_kicker', { n: today.done + 1, goal: today.target });

    return (
        <Screen kicker={kicker} title={t('focus_title')} onKickerTap={handleKickerTap}>
            {art_style === 'extruded'
                ? <ExtrudedTimerDial sweep_degrees={sweep_degrees} />
                : <SketchTimerDial sweep_degrees={sweep_degrees} />}

            <div className={styles.time_row}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={focus_length}
                        className={styles.time}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -30, opacity: 0 }}
                        // Spring only for movement: a springy opacity overshoots past 0
                        // and briefly brings the old number back as a ghost
                        transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                    >
                        {formatMinutes(focus_length)}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className={styles.pips} aria-label={t('focus_pips_label', { done: today.done, goal: today.target })}>
                {Array.from({ length: Math.max(today.target, today.done) }, (_, index) => (
                    <span key={index} className={index < today.done ? `${styles.pip} ${styles.pip_done} sk-frame sk-flat` : `${styles.pip} sk-frame sk-flat`}>
                        {index < today.done && <ScribbleMark variant={index} />}
                    </span>
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
