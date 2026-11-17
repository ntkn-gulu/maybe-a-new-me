import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { OPACITY_FADE, SPRING_POP } from './motion_presets';
import styles from './ribbon.module.css';

// Banner ribbon with folded tails ("CẤP 1 / 8", "HOÀN THÀNH").

export type RibbonColor = 'blue' | 'ink' | 'flame';

interface RibbonProps
{
    children: ReactNode;
    color?: RibbonColor;
}

export function Ribbon(props: RibbonProps)
{
    const color = props.color ?? 'blue';
    return (
        <motion.div
            className={`${styles.ribbon} ${styles[color]}`}
            initial={{ scaleX: 0.3, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ scaleX: SPRING_POP, opacity: OPACITY_FADE }}
        >
            <span className={`${styles.tail} ${styles.tail_left} sk-hide`} />
            <span className={`${styles.tail} ${styles.tail_right} sk-hide`} />
            <span className={`${styles.band} sk-frame sk-flat`}>{props.children}</span>
        </motion.div>
    );
}
