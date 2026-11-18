import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { useT } from '../i18n/use_t';
import { weekdayKey } from '../i18n/strings';
import { SPRING_PRESS } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import styles from './weekday_picker.module.css';

// Seven small extruded keys, Monday first; each one toggles a weekday
// (0 = Sunday ... 6 = Saturday). Chosen days are painted in the accent
// color and sink a little, like a latched key.

const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

interface WeekdayPickerProps
{
    value: number[];
    onChange: (weekdays: number[]) => void;
    aria_label: string;
}

export function WeekdayPicker(props: WeekdayPickerProps)
{
    const t = useT();

    function toggle(weekday: number): void
    {
        const is_on = props.value.includes(weekday);
        playSfx('toggle');
        triggerHaptic();
        props.onChange(is_on ? props.value.filter((day) => day !== weekday) : [...props.value, weekday].sort((a, b) => a - b));
    }

    return (
        <div className={styles.row} role="group" aria-label={props.aria_label}>
            {MONDAY_FIRST.map((weekday) =>
            {
                const is_on = props.value.includes(weekday);
                return (
                    <motion.div
                        key={weekday}
                        {...getPressableProps(() => toggle(weekday), false, 'switch')}
                        aria-checked={is_on}
                        className={is_on ? `${styles.day} ${styles.on} sk-frame sk-flat` : `${styles.day} sk-frame sk-flat`}
                        whileTap={{ scale: 0.88 }}
                        transition={SPRING_PRESS}
                    >
                        <span className={styles.label}>{t(weekdayKey(weekday))}</span>
                        <HapticOverlay />
                    </motion.div>
                );
            })}
        </div>
    );
}
