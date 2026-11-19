import { motion } from 'motion/react';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { itemNameKey } from '../../i18n/strings';
import { getItem } from '../../core/reward_catalog';
import { getTierForStreak } from '../../core/flame_tiers';
import type { ChestPull } from '../../core/inventory';
import type { Rarity } from '../../core/types';
import { useStreak } from '../../stores/progress_store';
import { ItemPreview } from './item_preview';
import styles from './chest_batch_summary.module.css';

// Small helpers for "open all": the row of pips that fills in as items are
// revealed one by one, and the summary grid of everything that came out.

const SUMMARY_PREVIEW_SIZE = 44;
const SUMMARY_STAGGER_S = 0.05;
const WIDE_GRID_FROM = 7;             // this many items or more: 4 columns instead of 3

interface RevealPipsProps
{
    rarities: Rarity[];               // reveal order
    revealed_count: number;
}

// One pip per chest: grey while waiting, the rarity color once revealed; the current one is bigger
export function RevealPips(props: RevealPipsProps)
{
    return (
        <div className={styles.pips} aria-hidden="true">
            {props.rarities.map((rarity, index) =>
            {
                const is_revealed = index < props.revealed_count;
                const is_current = index === props.revealed_count - 1;
                return (
                    <motion.span
                        key={index}
                        className={`${styles.pip} ${is_revealed ? styles[rarity] : ''} sk-frame sk-flat sk-round`}
                        animate={{ scale: is_current ? 1.35 : 1 }}
                        transition={SPRING_POP}
                    />
                );
            })}
        </div>
    );
}

interface BatchSummaryProps
{
    pulls: ChestPull[];               // reveal order
}

// Everything from the batch at a glance: picture, name, rarity, new or shards
export function BatchSummary(props: BatchSummaryProps)
{
    const t = useT();
    const tier_index = getTierForStreak(useStreak().current_streak).index;
    const new_count = props.pulls.filter((pull) => !pull.result.is_duplicate).length;
    const shard_total = props.pulls.reduce((sum, pull) => sum + pull.result.shards_gained, 0);
    const grid_class = props.pulls.length >= WIDE_GRID_FROM ? `${styles.grid} ${styles.grid_wide}` : styles.grid;

    return (
        <div className={styles.summary}>
            <h1 className={styles.title}>{t('batch_summary_title')}</h1>
            <p className={styles.totals}>{t('batch_summary_totals', { n: new_count, shards: shard_total })}</p>
            <div className={grid_class}>
                {props.pulls.map((pull, index) =>
                {
                    const item = getItem(pull.result.item_id);
                    if (!item)
                    {
                        return null;
                    }
                    return (
                        <motion.div
                            key={index}
                            className={`${styles.card} ${styles[pull.result.rarity]} sk-frame sk-flat`}
                            initial={{ y: 18, scale: 0.8, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            transition={{ y: { ...SPRING_POP, delay: index * SUMMARY_STAGGER_S }, scale: { ...SPRING_POP, delay: index * SUMMARY_STAGGER_S }, opacity: { ...OPACITY_FADE, delay: index * SUMMARY_STAGGER_S } }}
                        >
                            <span className={styles.rarity_dot} />
                            <ItemPreview item={item} is_owned tier_index={tier_index} size={SUMMARY_PREVIEW_SIZE} />
                            <span className={styles.name}>{t(itemNameKey(item.id))}</span>
                            <span className={pull.result.is_duplicate ? styles.shards : `${styles.badge_new} sk-frame sk-flat`}>
                                {pull.result.is_duplicate ? t('batch_summary_shards', { n: pull.result.shards_gained }) : t('batch_summary_new')}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
