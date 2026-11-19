import type { CSSProperties, ReactNode, RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import { itemNameKey, slotNameKey } from '../../i18n/strings';
import { getBestRarity, type ChestPull } from '../../core/inventory';
import { getItem } from '../../core/reward_catalog';
import { ExtrudedChestArt } from './extruded_chest_art';
import { SketchChestArt } from './sketch_chest_art';
import { SketchRarityGem } from './sketch_rarity_gem';
import { CRACKS, Cracks, RARITY_COLORS, SparkBurst } from './chest_opening_effects';
import styles from './chest_opening.module.css';

// The middle of the chest opening: the chest (glow, shake, cracks), then the
// flash, sparks and the gem of each revealed item. It is also the big tap
// target: tap the chest to crack it, tap again to see the next item of a batch.
// The beats themselves are run by ChestOpeningOverlay.

export type OpeningPhase = 'enter' | 'ready' | 'dark' | 'burst' | 'reveal' | 'summary';

export const TAPS_TO_OPEN = 3;

const CHEST_SIZE = 220;
const AURA_OPACITY = [0.18, 0.34, 0.55, 0.8];   // glow around the chest per tap so far

interface ChestStageProps
{
    phase: OpeningPhase;
    tap_count: number;
    reveal_index: number;
    pulls: ChestPull[];               // reveal order
    is_sketch: boolean;
    jolt_ref: RefObject<HTMLDivElement>;
    can_tap: boolean;
    onTap: () => void;
    tap_label: string | undefined;
}

export function ChestStage(props: ChestStageProps)
{
    const { phase, tap_count, reveal_index, pulls, is_sketch } = props;
    const best_color = RARITY_COLORS[getBestRarity(pulls)];
    const { result } = pulls[reveal_index];
    const item = getItem(result.item_id);
    const show_chest = phase === 'enter' || phase === 'ready' || phase === 'dark';
    const is_revealed = phase === 'reveal';
    const is_light_show = phase === 'burst' || is_revealed;
    // The first burst is the chest's (best drop's color), later ones each item's own
    const burst_rarity = reveal_index === 0 ? getBestRarity(pulls) : result.rarity;

    return (
        <div
            {...getPressableProps(props.onTap, !props.can_tap)}
            className={styles.stage}
            aria-label={props.tap_label}
        >
            {/* A flash at every burst */}
            {is_light_show && (
                <motion.div
                    key={`flash-${reveal_index}`}
                    className={styles.flash}
                    style={{ background: RARITY_COLORS[burst_rarity] }}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: [0, 0.9, 0], scale: [0.2, 2.4, 3.2] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                />
            )}

            <AnimatePresence>
                {show_chest && (
                    <motion.div
                        key="chest"
                        className={styles.chest_drop}
                        initial={{ y: -260, rotate: -8 }}
                        animate={{ y: 0, rotate: 0 }}
                        exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.18 } }}
                        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    >
                        <ChestAura color={best_color} level={phase === 'dark' ? TAPS_TO_OPEN : tap_count} />
                        <ShakingChest phase={phase} tap_count={tap_count}>
                            <div ref={props.jolt_ref} className={styles.chest_box}>
                                {is_sketch ? <SketchChestArt size={CHEST_SIZE} /> : <ExtrudedChestArt size={CHEST_SIZE} />}
                                <Cracks count={phase === 'dark' ? CRACKS.length : tap_count} color={best_color} is_sketch={is_sketch} is_glowing={phase === 'dark'} />
                                {pulls.length > 1 && <span className={`${styles.count_badge} sk-frame sk-flat sk-abs`}>×{pulls.length}</span>}
                            </div>
                        </ShakingChest>
                    </motion.div>
                )}
            </AnimatePresence>

            {is_light_show && <SparkBurst key={reveal_index} rarity={burst_rarity} seed={result.item_id.length * 7 + reveal_index} is_sketch={is_sketch} />}

            {/* The item rises out of where the chest was */}
            {is_revealed && item && (
                <motion.div
                    key={`gem-${reveal_index}`}
                    className={styles.gem_box}
                    initial={{ y: 60, scale: 0.2, rotate: -30 }}
                    animate={{ y: 0, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 13 }}
                >
                    {is_sketch ? <SketchRarityGem rarity={result.rarity} /> : <span className={styles.gem} />}
                </motion.div>
            )}

            <HapticOverlay is_disabled={!props.can_tap} />
        </div>
    );
}

interface StageCaptionProps
{
    phase: OpeningPhase;
    tap_count: number;
    reveal_index: number;
    pulls: ChestPull[];
}

// Under the stage: the taps left, then the revealed item's rarity, name,
// slot and whether it is new or became shards
export function StageCaption(props: StageCaptionProps)
{
    const t = useT();
    const { result } = props.pulls[props.reveal_index];
    const item = getItem(result.item_id);
    return (
        <div className={styles.details}>
            {props.phase === 'ready' && (
                <motion.span
                    key={props.tap_count}
                    className={`mono_label ${styles.tap_hint}`}
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                >
                    {t('chest_tap_hint', { n: TAPS_TO_OPEN - props.tap_count })}
                </motion.span>
            )}
            {props.phase === 'reveal' && item && (
                <motion.div
                    key={props.reveal_index}
                    className={styles.item_text}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE, delay: 0.2 }}
                >
                    <span className={styles.rarity}>{t(`rarity_${result.rarity}`)}</span>
                    <h1 className={styles.name}>{t(itemNameKey(item.id))}</h1>
                    <span className={styles.slot}>{t(slotNameKey(item.slot))}</span>
                    <p className={styles.status}>
                        {result.is_duplicate ? t('reveal_duplicate', { n: result.shards_gained }) : t('reveal_new')}
                    </p>
                </motion.div>
            )}
        </div>
    );
}

interface ShakingChestProps
{
    phase: OpeningPhase;
    tap_count: number;
    children: ReactNode;
}

// Shakes while waiting for taps, harder with every crack; trembles in the dark
function ShakingChest(props: ShakingChestProps)
{
    const shake = props.phase === 'dark'
        ? { x: [0, -4, 4, -6, 6, -8, 8, 0], transition: { duration: 0.5, repeat: Infinity } }
        : props.phase === 'ready'
            ? { x: [0, -(1 + props.tap_count * 1.5), 1 + props.tap_count * 1.5, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.6 - props.tap_count * 0.2 } }
            : { x: 0 };
    return <motion.div animate={shake}>{props.children}</motion.div>;
}

interface ChestAuraProps
{
    color: string;
    level: number;                    // taps so far (TAPS_TO_OPEN in the dark)
}

// A soft glow behind the chest in the best drop's color, stronger with every tap
function ChestAura(props: ChestAuraProps)
{
    return (
        <motion.div
            className={styles.aura}
            style={{ '--aura': props.color } as CSSProperties}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: AURA_OPACITY[props.level], scale: 0.8 + props.level * 0.14 }}
            transition={{ scale: SPRING_POP, opacity: { duration: 0.3 } }}
        />
    );
}
