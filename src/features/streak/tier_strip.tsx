import { motion } from 'motion/react';
import { FLAME_TIERS } from '../../core/flame_tiers';
import { FLAME_PALETTES } from './flame_palettes';
import { SPRING_PRESS, SPRING_SLIDE } from '../../ui/motion_presets';
import styles from './tier_strip.module.css';

// Row of all tiers as small flame badges. Reached tiers are colored,
// locked ones are outlines. Tapping one previews it.

// Simplified flame outline (same shape as the big flame, viewBox 0 0 200 260)
const MINI_FLAME_POINTS = '104,8 130,62 157,118 167,170 150,222 100,250 50,222 33,170 47,122 70,86 60,40 84,94';

interface TierStripProps
{
    reached_index: number;     // highest tier the user has unlocked
    selected_index: number;    // tier being shown above
    onSelect: (tier_index: number) => void;
}

export function TierStrip(props: TierStripProps)
{
    return (
        <div className={styles.strip}>
            {FLAME_TIERS.map((tier) =>
            {
                const is_reached = tier.index <= props.reached_index;
                const is_selected = tier.index === props.selected_index;
                const palette = FLAME_PALETTES[tier.index];
                return (
                    <motion.button
                        key={tier.index}
                        type="button"
                        className={styles.badge}
                        whileTap={{ scale: 0.8 }}
                        transition={SPRING_PRESS}
                        onClick={() => props.onSelect(tier.index)}
                        aria-label={`${tier.name}, ${tier.min_days} ngày`}
                    >
                        <svg viewBox="0 0 200 260" className={styles.icon}>
                            <polygon
                                points={MINI_FLAME_POINTS}
                                fill={is_reached ? palette.shades[2] : 'none'}
                                stroke={is_reached ? palette.shades[0] : 'var(--color-ink-faint)'}
                                strokeWidth={is_reached ? 10 : 14}
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className={styles.days}>{tier.min_days}</span>
                        {is_selected && (
                            <motion.span layoutId="tier-marker" className={styles.marker} transition={SPRING_SLIDE} />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
