import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { playSfx } from '../../sound/sfx_engine';
import { SPRING_POP } from '../../ui/motion_presets';
import styles from './focus_screen.module.css';

// Focus tab. A chunky kitchen-timer dial: the colored wedge shows how long
// the session is, the needle sits at its end. Phase 0 shows the layout;
// the real countdown, anti-cheat guard and wake lock arrive in phase 2.

type FocusLength = 25 | 50;

const FOCUS_LENGTHS: FocusLength[] = [25, 50];
const DEGREES_PER_MINUTE = 6;          // 60 minutes = full circle
const TICK_COUNT = 60;
const DEMO_DAILY_GOAL = 4;
const DEMO_DONE_TODAY = 0;

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
    const [focus_length, setFocusLength] = useState<FocusLength>(25);
    const [is_preview_note_visible, setIsPreviewNoteVisible] = useState(false);

    const sweep_degrees = useSpring(focus_length * DEGREES_PER_MINUTE, DIAL_SPRING);
    const wedge_background = useTransform(
        sweep_degrees,
        (degrees) => `conic-gradient(var(--wedge-color) 0deg ${degrees}deg, transparent ${degrees}deg)`,
    );

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
        playSfx('chime');
        setIsPreviewNoteVisible(true);
    }

    return (
        <Screen kicker={`Phiên ${DEMO_DONE_TODAY + 1} / ${DEMO_DAILY_GOAL} hôm nay`} title="Tập trung">
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
                    <motion.div className={styles.wedge} style={{ background: wedge_background }} />
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

            <div className={styles.pips} aria-label={`${DEMO_DONE_TODAY} trên ${DEMO_DAILY_GOAL} pomodoro hôm nay`}>
                {Array.from({ length: DEMO_DAILY_GOAL }, (_, index) => (
                    <span key={index} className={index < DEMO_DONE_TODAY ? `${styles.pip} ${styles.pip_done}` : styles.pip} />
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
                        {length} phút
                    </TactileButton>
                ))}
            </div>

            <div className={styles.start_area}>
                <TactileButton variant="accent" size="lg" is_full_width onClick={handleStart}>
                    Bắt đầu
                </TactileButton>
                <AnimatePresence>
                    {is_preview_note_visible && (
                        <motion.p
                            className={styles.preview_note}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            Đồng hồ thật + chế độ strict có ở GĐ2
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </Screen>
    );
}
