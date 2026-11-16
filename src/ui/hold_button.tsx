import { useState } from 'react';
import { motion } from 'motion/react';
import { playSfx } from '../sound/sfx_engine';
import styles from './hold_button.module.css';

// Press and hold to confirm (no pop-up dialog). A fill grows while held;
// letting go early cancels. Used for "give up" so it can't happen by accident.

interface HoldButtonProps
{
    label: string;
    onConfirm: () => void;
    hold_ms?: number;
}

const DEFAULT_HOLD_MS = 2000;

export function HoldButton(props: HoldButtonProps)
{
    const hold_ms = props.hold_ms ?? DEFAULT_HOLD_MS;
    const [is_holding, setIsHolding] = useState(false);

    function begin(): void
    {
        setIsHolding(true);
        playSfx('press');
    }

    function cancel(): void
    {
        if (is_holding)
        {
            setIsHolding(false);
            playSfx('release');
        }
    }

    function handleFillDone(): void
    {
        if (is_holding)
        {
            setIsHolding(false);
            props.onConfirm();
        }
    }

    return (
        <button
            type="button"
            className={styles.button}
            onPointerDown={begin}
            onPointerUp={cancel}
            onPointerLeave={cancel}
            onPointerCancel={cancel}
            onContextMenu={(event) => event.preventDefault()}
        >
            <motion.span
                className={styles.fill}
                initial={false}
                animate={{ scaleX: is_holding ? 1 : 0 }}
                transition={is_holding ? { duration: hold_ms / 1000, ease: 'linear' } : { duration: 0.2 }}
                onAnimationComplete={handleFillDone}
            />
            <span className={styles.label}>{props.label}</span>
        </button>
    );
}
