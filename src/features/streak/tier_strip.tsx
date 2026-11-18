import { motion } from 'motion/react';
import { FLAME_TIERS } from '../../core/flame_tiers';
import { TIER_COLORS } from './flame_palettes';
import { SPRING_PRESS, SPRING_SLIDE } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { tierNameKey } from '../../i18n/strings';
import { useArtStyle } from '../../stores/active_theme';
import { MiniFlame } from './mini_flame';
import styles from './tier_strip.module.css';

// Row of all tiers as small flame badges. Reached tiers are colored,
// locked ones are outlines (their names stay hidden too). Tapping one shows it above.

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
                        <MiniFlame colors={is_reached ? colors : null} art_style={art_style} className={styles.icon} />
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
