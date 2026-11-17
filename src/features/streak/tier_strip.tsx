import { motion } from 'motion/react';
import { FLAME_TIERS } from '../../core/flame_tiers';
import { TIER_COLORS } from './flame_palettes';
import { SPRING_PRESS, SPRING_SLIDE } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { tierNameKey } from '../../i18n/strings';
import { useArtStyle } from '../../stores/active_theme';
import { INK_COLOR, MINI_FLAME_MARKER, MINI_FLAME_OUTLINE } from './sketch_flame_art';
import styles from './tier_strip.module.css';

// Row of all tiers as small flame badges. Reached tiers are colored,
// locked ones are outlines (their names stay hidden too). Tapping one shows it above.

// The 3D theme keeps the original faceted outline
const MINI_LOW_POLY_POINTS = '104,8 130,62 157,118 167,170 150,222 100,250 50,222 33,170 47,122 70,86 60,40 84,94';

interface TierStripProps
{
    reached_index: number;     // highest tier the user has unlocked
    selected_index: number;    // tier being shown above
    onSelect: (tier_index: number) => void;
}

export function TierStrip(props: TierStripProps)
{
    const t = useT();
    const art_style = useArtStyle();

    return (
        <div className={`${styles.strip} sk-frame`}>
            {FLAME_TIERS.map((tier) =>
            {
                const is_reached = tier.index <= props.reached_index;
                const is_selected = tier.index === props.selected_index;
                const colors = TIER_COLORS[tier.index];
                return (
                    <motion.div
                        key={tier.index}
                        {...getPressableProps(() => props.onSelect(tier.index))}
                        className={styles.badge}
                        whileTap={{ scale: 0.8 }}
                        transition={SPRING_PRESS}
                        aria-label={is_reached
                            ? t('journey_tier_label', { name: t(tierNameKey(tier.index)), n: tier.min_days })
                            : t('journey_locked_label', { level: tier.index, n: tier.min_days })}
                    >
                        <svg viewBox="0 0 200 260" className={styles.icon}>
                            {art_style === 'extruded'
                                ? (
                                    <polygon
                                        points={MINI_LOW_POLY_POINTS}
                                        fill={is_reached ? colors.shades[2] : 'none'}
                                        stroke={is_reached ? colors.shades[0] : 'var(--color-ink-faint)'}
                                        strokeWidth={is_reached ? 10 : 14}
                                        strokeLinejoin="round"
                                    />
                                )
                                : (
                                    // Sketch theme: marker color slipping past a hand-drawn ink line
                                    <g strokeLinecap="round" strokeLinejoin="round">
                                        {is_reached && <path d={MINI_FLAME_MARKER} fill={colors.shades[2]} />}
                                        <path
                                            d={MINI_FLAME_OUTLINE}
                                            fill="none"
                                            stroke={is_reached ? INK_COLOR : 'var(--color-ink-faint)'}
                                            strokeWidth={is_reached ? 13 : 11}
                                        />
                                    </g>
                                )}
                        </svg>
                        <span className={styles.days}>{tier.min_days}</span>
                        {is_selected && (
                            <motion.span layoutId="tier-marker" className={styles.marker} transition={SPRING_SLIDE} />
                        )}
                        <HapticOverlay />
                    </motion.div>
                );
            })}
        </div>
    );
}
