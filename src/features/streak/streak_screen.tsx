import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { FLAME_TIERS, getTierProgress } from '../../core/flame_tiers';
import { playSfx } from '../../sound/sfx_engine';
import { LowPolyFlame } from './low_poly_flame';
import { TierStrip } from './tier_strip';
import styles from './streak_screen.module.css';

// Journey tab: the current flame, its words of support, progress to the
// next tier, and a strip of every tier that can be tapped to preview.
// Streak data is not stored yet (phase 2), so the streak is 0 for now.

const DEMO_STREAK_DAYS = 0;
const LAST_TIER_INDEX = FLAME_TIERS.length - 1;

export function StreakScreen()
{
    const progress = getTierProgress(DEMO_STREAK_DAYS);
    const [selected_index, setSelectedIndex] = useState(progress.current.index);

    const selected_tier = FLAME_TIERS[selected_index];
    const is_current = selected_index === progress.current.index;
    const is_locked = selected_index > progress.current.index;

    function selectTier(tier_index: number): void
    {
        if (tier_index === selected_index)
        {
            return;
        }
        playSfx('whoosh');
        setSelectedIndex(tier_index);
    }

    let ribbon_text = `${DEMO_STREAK_DAYS} ngày liên tiếp`;
    if (is_locked)
    {
        ribbon_text = `Mở khóa ở ${selected_tier.min_days} ngày`;
    }
    else if (!is_current)
    {
        ribbon_text = 'Đã đi qua';
    }

    return (
        <Screen kicker={`Hành trình · Cấp ${selected_index} / ${LAST_TIER_INDEX}`} align="center">
            <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                    key={selected_tier.name}
                    className={styles.tier_name}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {selected_tier.name}
                </motion.h1>
            </AnimatePresence>

            <div className={styles.ribbon_row}>
                <Ribbon key={ribbon_text} color={is_locked ? 'ink' : 'blue'}>
                    {is_locked ? '🔒 ' : ''}{ribbon_text}
                </Ribbon>
            </div>

            <div className={is_locked ? `${styles.scene} ${styles.locked}` : styles.scene}>
                <LowPolyFlame tier_index={selected_index} size={240} />
            </div>

            <div className={styles.words}>
                <TypewriterText text={selected_tier.words} start_delay_ms={350} />
            </div>

            {is_current && progress.next && (
                <div className={styles.progress}>
                    <div className={styles.counter}>
                        <span>{progress.days_into_tier}</span>
                        <span className={styles.counter_slash}>/</span>
                        <span>{progress.days_to_next}</span>
                    </div>
                    <div className={styles.bar}>
                        <motion.div
                            className={styles.bar_fill}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(progress.ratio * 100, 2)}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.4 }}
                        />
                    </div>
                    <span className="mono_label">Tới {progress.next.name}</span>
                </div>
            )}

            <div className={styles.strip_area}>
                <TierStrip
                    reached_index={progress.current.index}
                    selected_index={selected_index}
                    onSelect={selectTier}
                />
            </div>
        </Screen>
    );
}
