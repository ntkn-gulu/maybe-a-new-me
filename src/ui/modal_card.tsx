import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { OPACITY_FADE, SPRING_POP } from './motion_presets';
import styles from './modal_card.module.css';

// A paper card that drops in over a dimmed backdrop. Rendered into <body>
// so no transformed parent can trap its fixed position, and placed near the
// top so the iPhone keyboard never covers a text field inside it.
// Tapping the backdrop calls onClose.

interface ModalCardProps
{
    is_open: boolean;
    onClose: () => void;
    aria_label: string;
    children: ReactNode;
}

export function ModalCard(props: ModalCardProps)
{
    return createPortal(
        <AnimatePresence>
            {props.is_open && (
                <motion.div
                    key="modal"
                    className={styles.backdrop}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={OPACITY_FADE}
                    onClick={props.onClose}
                >
                    <motion.div
                        className={`${styles.card} sk-frame`}
                        role="dialog"
                        aria-modal="true"
                        aria-label={props.aria_label}
                        initial={{ y: -40, scale: 0.94 }}
                        animate={{ y: 0, scale: 1 }}
                        exit={{ y: -24, scale: 0.96 }}
                        transition={SPRING_POP}
                        // Taps inside the card must not reach the backdrop
                        onClick={(event) => event.stopPropagation()}
                    >
                        {props.children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
