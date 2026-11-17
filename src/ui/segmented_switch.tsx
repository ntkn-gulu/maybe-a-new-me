import { useId } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { SPRING_SLIDE } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import styles from './segmented_switch.module.css';

// A sunken track with 2+ labeled options and a raised thumb that slides
// to the chosen one (used for the VI | EN language switch).

export interface SegmentOption<Value extends string>
{
    value: Value;
    label: string;
}

interface SegmentedSwitchProps<Value extends string>
{
    options: SegmentOption<Value>[];
    value: Value;
    onChange: (value: Value) => void;
    aria_label: string;
}

export function SegmentedSwitch<Value extends string>(props: SegmentedSwitchProps<Value>)
{
    // Unique layoutId per instance, so two switches never share a thumb
    const thumb_id = useId();

    function choose(value: Value): void
    {
        if (value === props.value)
        {
            return;
        }
        playSfx('toggle');
        triggerHaptic();
        props.onChange(value);
    }

    return (
        <div className={`${styles.track} sk-frame sk-flat`} role="radiogroup" aria-label={props.aria_label}>
            {props.options.map((option) =>
            {
                const is_active = option.value === props.value;
                return (
                    <div
                        key={option.value}
                        {...getPressableProps(() => choose(option.value), false, 'radio')}
                        aria-checked={is_active}
                        className={is_active ? `${styles.option} ${styles.active}` : styles.option}
                    >
                        {is_active && (
                            <motion.span layoutId={thumb_id} className={`${styles.thumb} sk-frame sk-flat sk-abs`} transition={SPRING_SLIDE} />
                        )}
                        <span className={styles.label}>{option.label}</span>
                        <HapticOverlay />
                    </div>
                );
            })}
        </div>
    );
}
