import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { SPRING_PRESS } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import styles from './toggle_switch.module.css';

// Chunky on/off switch with a springy knob and a "tick" sound.

interface ToggleSwitchProps
{
    is_on: boolean;
    onChange: (is_on: boolean) => void;
    aria_label: string;
}

// Knob travel distance in pixels (track width - knob width - padding)
const KNOB_TRAVEL = 22;

export function ToggleSwitch(props: ToggleSwitchProps)
{
    function flip(): void
    {
        playSfx('toggle');
        triggerHaptic();
        props.onChange(!props.is_on);
    }

    return (
        <div
            {...getPressableProps(flip, false, 'switch')}
            aria-checked={props.is_on}
            aria-label={props.aria_label}
            className={props.is_on ? `${styles.track} ${styles.on} sk-frame sk-flat` : `${styles.track} sk-frame sk-flat`}
        >
            <motion.span
                className={`${styles.knob} sk-frame sk-flat sk-round sk-abs`}
                animate={{ x: props.is_on ? KNOB_TRAVEL : 0 }}
                transition={SPRING_PRESS}
            />
            <HapticOverlay />
        </div>
    );
}
