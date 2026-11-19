import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { getPressableProps } from '../../ui/pressable';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { useT } from '../../i18n/use_t';
import { chestNameKey } from '../../i18n/strings';
import { getItem } from '../../core/reward_catalog';
import { getBestRarity, sortPullsForReveal, type ChestBatch } from '../../core/inventory';
import type { Rarity } from '../../core/types';
import { useBatchSize, useInventoryStore } from '../../stores/inventory_store';
import { useArtStyle } from '../../stores/active_theme';
import { canEquipNow } from './item_usable';
import { RARITY_COLORS, Rays } from './chest_opening_effects';
import { ChestStage, StageCaption, TAPS_TO_OPEN, type OpeningPhase } from './chest_stage';
import { BatchSummary, RevealPips } from './chest_batch_summary';
import styles from './chest_opening.module.css';

// Full-screen chest opening, in beats:
// 1. enter:   the chest drops in and starts to shake
// 2. ready:   the user taps it TAPS_TO_OPEN times; each tap jolts it, adds a
//             crack with light leaking out and a louder crack sound, and the
//             glow around it grows. The finger lands on a HapticOverlay, so
//             iPhones buzz.
// 3. dark:    best drop legendary only: the screen goes dark, the chest trembles
// 4. burst:   a flash, the chest is gone, rays and sparks fly
// 5. reveal:  the item rises out: gem, rarity, name, slot, new / shards, buttons
// 6. summary: "open all" only: every item of the batch in one grid
// "Open all" opens several chests as one: the light that leaks out is the
// color of the best drop (like a gacha pull), then the items are revealed
// one at a time, rarest last ("Next", or tap the stage; "Skip" jumps to the
// summary). The results are already decided (openChests); this only stages them.

const ENTER_MS = 650;
const DARK_MS = 1100;                 // legendary build-up in the dark
const BURST_MS = 480;
const BUTTONS_DELAY_MS = 900;
const NEXT_BUTTONS_DELAY_MS = 420;    // between items of a batch: short, but no accidental double skip
const TAP_CRACK_LOUDNESS = [0.4, 0.7];
const NEXT_BURST_LOUDNESS = 0.45;

function playRevealSound(rarity: Rarity): void
{
    playSfx(rarity === 'legendary' || rarity === 'epic' ? 'chime' : 'sparkle');
}

interface ChestOpeningOverlayProps
{
    batch: ChestBatch | null;         // null = closed
    onOpenMore: (count: number) => void;
    onClose: () => void;
}

export function ChestOpeningOverlay(props: ChestOpeningOverlayProps)
{
    return createPortal(
        <AnimatePresence>
            {props.batch && (
                <OpeningStage
                    // A new key per batch restarts the whole sequence for "open more"
                    key={`${props.batch.pulls[0].result.item_id}-${props.batch.inventory.pending_chests.length}`}
                    batch={props.batch}
                    onOpenMore={props.onOpenMore}
                    onClose={props.onClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );
}

interface OpeningStageProps
{
    batch: ChestBatch;
    onOpenMore: (count: number) => void;
    onClose: () => void;
}

function OpeningStage(props: OpeningStageProps)
{
    const t = useT();
    const is_sketch = useArtStyle() === 'sketch';
    const equipped = useInventoryStore((state) => state.equipped);
    const equip = useInventoryStore((state) => state.equip);
    const chests_left = useInventoryStore((state) => state.pending_chests.length);
    const batch_size = useBatchSize();
    const [pulls] = useState(() => sortPullsForReveal(props.batch.pulls));
    const [phase, setPhase] = useState<OpeningPhase>('enter');
    const [tap_count, setTapCount] = useState(0);
    const [reveal_index, setRevealIndex] = useState(0);
    const [is_buttons_ready, setIsButtonsReady] = useState(false);
    const [jolt_scope, animateJolt] = useAnimate<HTMLDivElement>();
    const timers = useRef<number[]>([]);

    const is_batch = pulls.length > 1;
    const is_last = reveal_index === pulls.length - 1;
    const best_rarity = getBestRarity(pulls);
    const { result } = pulls[reveal_index];
    const item = getItem(result.item_id);

    function later(callback: () => void, delay_ms: number): void
    {
        timers.current.push(window.setTimeout(callback, delay_ms));
    }

    useEffect(() =>
    {
        playSfx('whoosh');
        const enter_timer = window.setTimeout(() => setPhase('ready'), ENTER_MS);
        const pending = timers.current;
        return () =>
        {
            window.clearTimeout(enter_timer);
            pending.forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    function burst(): void
    {
        setPhase('burst');
        playSfx('burst');
        later(() =>
        {
            setPhase('reveal');
            playRevealSound(pulls[0].result.rarity);
        }, BURST_MS);
        later(() => setIsButtonsReady(true), BURST_MS + BUTTONS_DELAY_MS);
    }

    function tapChest(): void
    {
        triggerHaptic();                          // Android; iPhones buzz through the HapticOverlay
        const next_count = tap_count + 1;
        setTapCount(next_count);
        const direction = next_count % 2 === 0 ? 1 : -1;
        animateJolt(jolt_scope.current, { rotate: [0, 10 * direction, -7 * direction, 3 * direction, 0], scale: [1, 1.08, 1] }, { duration: 0.35 });

        if (next_count < TAPS_TO_OPEN)
        {
            playSfx('crack', TAP_CRACK_LOUDNESS[next_count - 1]);
            return;
        }
        playSfx('crack', 1);
        if (best_rarity === 'legendary')
        {
            setPhase('dark');
            playSfx('rise');
            later(burst, DARK_MS);
            return;
        }
        burst();
    }

    // Batch: the next item pops out with its own small burst; after the last, the summary
    function showNext(): void
    {
        setIsButtonsReady(false);
        if (is_last)
        {
            showSummary();
            return;
        }
        const next_rarity = pulls[reveal_index + 1].result.rarity;
        setRevealIndex(reveal_index + 1);
        playSfx('burst', NEXT_BURST_LOUDNESS);
        playRevealSound(next_rarity);
        later(() => setIsButtonsReady(true), NEXT_BUTTONS_DELAY_MS);
    }

    function showSummary(): void
    {
        setIsButtonsReady(false);
        setPhase('summary');
        playSfx('sparkle');
        later(() => setIsButtonsReady(true), NEXT_BUTTONS_DELAY_MS);
    }

    const can_tap_stage = phase === 'ready' || (phase === 'reveal' && is_batch && is_buttons_ready);
    function tapStage(): void
    {
        if (phase === 'ready')
        {
            tapChest();
        }
        else if (can_tap_stage)
        {
            triggerHaptic();
            showNext();
        }
    }

    const is_revealed = phase === 'reveal';
    const is_light_show = phase === 'burst' || is_revealed;
    // Dark while a legendary builds up and bursts; the light comes back with the first item
    const is_dark = best_rarity === 'legendary' && (phase === 'dark' || phase === 'burst');
    // Before the burst everything glows in the best drop's color, then in each item's own
    const shown_rarity = is_revealed ? result.rarity : best_rarity;
    const shown_color = RARITY_COLORS[shown_rarity];
    const heading = is_batch ? t('chest_batch_heading', { n: pulls.length }) : t(chestNameKey(pulls[0].chest_type));

    return (
        <motion.div
            className={`${styles.layer} ${styles[shown_rarity]} ${is_dark ? styles.dark : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
        >
            {/* The dark of a legendary build-up */}
            <motion.div
                className={styles.darkness}
                initial={{ opacity: 0 }}
                animate={{ opacity: is_dark ? 1 : 0 }}
                transition={{ duration: is_dark ? 0.6 : 1.2 }}
            />

            {/* Slowly turning rays behind the item once it is out */}
            <motion.div
                className={styles.rays_box}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={is_light_show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                transition={{ scale: SPRING_POP, opacity: { duration: 0.35 } }}
            >
                <Rays color={shown_color} is_sketch={is_sketch} />
            </motion.div>

            <div className={styles.content}>
                <div className={styles.heading}>
                    <span className="mono_label">{heading}</span>
                    {is_batch && phase !== 'summary' && <RevealPips rarities={pulls.map((pull) => pull.result.rarity)} revealed_count={is_revealed ? reveal_index + 1 : 0} />}
                    {is_batch && is_revealed && !is_last && (
                        <span {...getPressableProps(showSummary)} className={`mono_label ${styles.skip}`}>{t('reveal_skip')}</span>
                    )}
                </div>

                {phase === 'summary'
                    ? <div className={styles.summary_box}><BatchSummary pulls={pulls} /></div>
                    : (
                        <>
                            <ChestStage
                                phase={phase}
                                tap_count={tap_count}
                                reveal_index={reveal_index}
                                pulls={pulls}
                                is_sketch={is_sketch}
                                jolt_ref={jolt_scope}
                                can_tap={can_tap_stage}
                                onTap={tapStage}
                                tap_label={phase === 'ready' ? t('chest_tap_hint', { n: TAPS_TO_OPEN - tap_count }) : undefined}
                            />

                            <StageCaption phase={phase} tap_count={tap_count} reveal_index={reveal_index} pulls={pulls} />
                        </>
                    )}

                <motion.div
                    className={styles.actions}
                    initial={{ y: 20, opacity: 0 }}
                    animate={is_buttons_ready ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                    style={{ pointerEvents: is_buttons_ready ? 'auto' : 'none' }}
                >
                    {is_revealed && item && canEquipNow(item) && (
                        equipped[item.slot] === item.id
                            ? <TactileButton size="md" is_full_width is_disabled>{t('reveal_equipped')}</TactileButton>
                            : <TactileButton size="md" variant="ink" is_full_width onClick={() => equip(item.id)}>{t('reveal_equip')}</TactileButton>
                    )}
                    {is_revealed && is_batch && (
                        <TactileButton size="lg" variant="accent" is_full_width onClick={showNext}>
                            {is_last ? t('reveal_see_all') : t('reveal_next')}
                        </TactileButton>
                    )}
                    {!is_batch && chests_left > 0 && (
                        <TactileButton size="md" is_full_width onClick={() => props.onOpenMore(1)}>{t('chest_open_next', { n: chests_left })}</TactileButton>
                    )}
                    {phase === 'summary' && batch_size > 1 && (
                        <TactileButton size="md" is_full_width onClick={() => props.onOpenMore(batch_size)}>{t('chest_open_batch', { n: batch_size })}</TactileButton>
                    )}
                    {(!is_batch || phase === 'summary') && (
                        <TactileButton size="lg" variant="accent" is_full_width onClick={props.onClose}>{t('reveal_close')}</TactileButton>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
