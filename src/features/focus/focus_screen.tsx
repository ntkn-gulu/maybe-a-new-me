import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import { TactileButton } from '../../ui/tactile_button';
import { playSfx } from '../../sound/sfx_engine';
import { SPRING_POP } from '../../ui/motion_presets';
import styles from './focus_screen.module.css';

// Focus tab. Phase 0 shows the layout only; the real timer,
// anti-cheat guard and wake lock arrive in phase 2.

type FocusLength = 25 | 50;

const FOCUS_LENGTHS: FocusLength[] = [25, 50];
const DIAL_RADIUS = 120;
const DIAL_STROKE = 14;
const DIAL_SIZE = (DIAL_RADIUS + DIAL_STROKE) * 2;

function formatMinutes(minutes: number): string
{
    return `${String(minutes).padStart(2, '0')}:00`;
}

export function FocusScreen()
{
    const [focus_length, setFocusLength] = useState<FocusLength>(25);
    const [is_preview_note_visible, setIsPreviewNoteVisible] = useState(false);

    function handleStart(): void
    {
        playSfx('chime');
        setIsPreviewNoteVisible(true);
    }

    return (
        <Screen title="Tập trung" subtitle="Hôm nay: 0 / 4 pomodoro">
            <div className={styles.dial_wrap}>
                <svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`} className={styles.dial}>
                    <circle
                        cx={DIAL_SIZE / 2}
                        cy={DIAL_SIZE / 2}
                        r={DIAL_RADIUS}
                        className={styles.dial_track}
                        strokeWidth={DIAL_STROKE}
                    />
                    <circle
                        cx={DIAL_SIZE / 2}
                        cy={DIAL_SIZE / 2}
                        r={DIAL_RADIUS}
                        className={styles.dial_ticks}
                        strokeWidth={DIAL_STROKE}
                    />
                </svg>
                <div className={styles.time_block}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={focus_length}
                            className={styles.time}
                            initial={{ y: 24, opacity: 0, filter: 'blur(6px)' }}
                            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                            exit={{ y: -24, opacity: 0, filter: 'blur(6px)' }}
                            transition={SPRING_POP}
                        >
                            {formatMinutes(focus_length)}
                        </motion.span>
                    </AnimatePresence>
                    <span className={styles.time_caption}>phút tập trung</span>
                </div>
            </div>

            <div className={styles.length_row}>
                {FOCUS_LENGTHS.map((length) => (
                    <TactileButton
                        key={length}
                        size="sm"
                        is_selected={length === focus_length}
                        onClick={() => setFocusLength(length)}
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
                            Đồng hồ thật + chế độ strict sẽ có ở GĐ2 ⏳
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </Screen>
    );
}
