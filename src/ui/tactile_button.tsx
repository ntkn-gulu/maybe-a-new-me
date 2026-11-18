import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import { triggerHaptic } from '../sound/haptic_hack';
import { SPRING_PRESS } from './motion_presets';
import { getPressableProps } from './pressable';
import { HapticOverlay } from './haptic_overlay';
import { MarkerFill } from './sketch_marks';
import styles from './tactile_button.module.css';

// A physical-feeling 3D button: the face sinks into its base on press,
// springs back on release, with a sound + haptic at both moments.

export type TactileVariant = 'accent' | 'neutral' | 'ink';
export type TactileSize = 'sm' | 'md' | 'lg';

interface TactileButtonProps
{
    children: ReactNode;
    onClick?: () => void;
    variant?: TactileVariant;
    size?: TactileSize;
    is_selected?: boolean;       // stays pressed-in, used for segmented choices
    is_disabled?: boolean;
    is_full_width?: boolean;
    aria_label?: string;
}

// Thickness of the button "side" in pixels, per size
const DEPTH_BY_SIZE: Record<TactileSize, number> = { sm: 5, md: 7, lg: 10 };

// How far a selected (latched) button stays sunk, as a share of depth
const SELECTED_SINK_RATIO = 0.6;

export function TactileButton(props: TactileButtonProps)
{
    const variant = props.variant ?? 'neutral';
    const size = props.size ?? 'md';
    const depth = DEPTH_BY_SIZE[size];
    const [is_pressed, setIsPressed] = useState(false);

    let sink = 0;
    if (is_pressed)
    {
        sink = depth;
    }
    else if (props.is_selected)
    {
        sink = depth * SELECTED_SINK_RATIO;
    }

    function handlePointerDown(): void
    {
        if (props.is_disabled)
        {
            return;
        }
        setIsPressed(true);
        playSfx('press');
    }

    // iPhone haptics come from the HapticOverlay under the finger;
    // triggerHaptic covers Android (vibration needs a click, not pointerdown).
    function handleClick(): void
    {
        triggerHaptic();
        props.onClick?.();
    }

    function handlePointerUp(): void
    {
        if (!is_pressed)
        {
            return;
        }
        setIsPressed(false);
        playSfx('release');
    }

    const class_names = [
        styles.button,
        styles[variant],
        styles[size],
        props.is_full_width ? styles.full_width : '',
        props.is_selected ? styles.selected : '',
        props.is_disabled ? styles.disabled : '',
    ].join(' ');

    return (
        <div
            {...getPressableProps(handleClick, props.is_disabled)}
            className={class_names}
            style={{ paddingBottom: depth }}
            aria-label={props.aria_label}
            aria-pressed={props.is_selected}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <span className={`${styles.base} sk-hatch-block`} style={{ top: depth }} />
            <motion.span
                className={variant === 'accent' ? `${styles.face} sk-frame sk-flat sk-marker` : `${styles.face} sk-frame sk-flat`}
                animate={{ y: sink }}
                transition={SPRING_PRESS}
            >
                {variant === 'accent' && <MarkerFill />}
                {props.children}
            </motion.span>
            <HapticOverlay is_disabled={props.is_disabled} />
        </div>
    );
}
