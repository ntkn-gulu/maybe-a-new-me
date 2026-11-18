import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { createRandom } from '../../ui/sketch_draw';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { useT } from '../../i18n/use_t';
import { chestNameKey, itemNameKey, slotNameKey } from '../../i18n/strings';
import { getItem } from '../../core/reward_catalog';
import type { ChestOpening } from '../../core/inventory';
import type { Rarity } from '../../core/types';
import { useInventoryStore } from '../../stores/inventory_store';
import { useArtStyle } from '../../stores/active_theme';
import { canEquipNow } from './item_usable';
import { ExtrudedChestArt } from './extruded_chest_art';
import { SketchChestArt } from './sketch_chest_art';
import { SketchRarityGem } from './sketch_rarity_gem';
import styles from './chest_opening.module.css';

// Full-screen chest opening, in beats:
// 1. enter:  the chest drops in and starts to shake
// 2. ready:  the user taps it TAPS_TO_OPEN times; each tap jolts it, adds a
//            crack with light of the rarity color leaking out, and a louder
//            crack sound. The finger lands on a HapticOverlay, so iPhones buzz.
// 3. dark:   legendary only: the screen goes dark and the chest trembles
// 4. burst:  a flash in the rarity color, the chest is gone, rays and sparks fly
// 5. reveal: the item rises out: gem, rarity, name, slot, new / shards, buttons
//            (after a legendary the light slowly comes back)
// The result is already decided when it starts (openNextChest); this only
// stages it. Vector shapes moved with transform/opacity only (no SVG filters).

type Phase = 'enter' | 'ready' | 'dark' | 'burst' | 'reveal';

const ENTER_MS = 650;
const DARK_MS = 1100;                 // legendary build-up in the dark
const BURST_MS = 480;
const BUTTONS_DELAY_MS = 900;
const TAPS_TO_OPEN = 3;
const TAP_CRACK_LOUDNESS = [0.4, 0.7];
const CHEST_SIZE = 220;
const RAY_COUNT = 16;
const SPARK_COUNT: Record<Rarity, number> = { common: 8, rare: 12, epic: 16, legendary: 24 };
const RARITY_COLORS: Record<Rarity, string> = { common: '#b9b2a6', rare: '#2d9bff', epic: '#9a5bff', legendary: '#ffb400' };

// Cracks on the chest (chest viewBox 0 0 200 180), one more per tap
const CRACKS = [
    'M78 104 L85 117 L80 127 L89 140 L85 158',
    'M66 92 L54 100 L47 114 L36 120 M64 80 L58 70 L62 62 L54 57',
    'M90 90 L104 99 L113 94 L126 106 M144 86 L152 100 L147 114 L156 128',
];

interface Spark
{
    angle: number;
    distance: number;
    size: number;
    spin: number;
    delay: number;
}

function buildSparks(count: number, seed: number): Spark[]
{
    const random = createRandom(seed);
    return Array.from({ length: count }, (_, index) => ({
        angle: (index / count) * Math.PI * 2 + (random() - 0.5) * 0.5,
        distance: 110 + random() * 90,
        size: 8 + random() * 10,
        spin: (random() - 0.5) * 540,
        delay: random() * 0.08,
    }));
}

interface ChestOpeningOverlayProps
{
    opening: ChestOpening | null;     // null = closed
    onOpenNext: () => void;           // open the next waiting chest right away
    onClose: () => void;
}

export function ChestOpeningOverlay(props: ChestOpeningOverlayProps)
{
    return createPortal(
        <AnimatePresence>
            {props.opening && (
                <OpeningStage
                    // A new key per chest restarts the whole sequence for "open next"
                    key={`${props.opening.result.item_id}-${props.opening.inventory.pending_chests.length}`}
                    opening={props.opening}
                    onOpenNext={props.onOpenNext}
                    onClose={props.onClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );
}

interface OpeningStageProps
{
    opening: ChestOpening;
    onOpenNext: () => void;
    onClose: () => void;
}

function OpeningStage(props: OpeningStageProps)
{
    const t = useT();
    const art_style = useArtStyle();
    const is_sketch = art_style === 'sketch';
    const equipped = useInventoryStore((state) => state.equipped);
    const equip = useInventoryStore((state) => state.equip);
    const chests_left = useInventoryStore((state) => state.pending_chests.length);
    const [phase, setPhase] = useState<Phase>('enter');
    const [tap_count, setTapCount] = useState(0);
    const [is_buttons_ready, setIsButtonsReady] = useState(false);
    const [jolt_scope, animateJolt] = useAnimate<HTMLDivElement>();
    const timers = useRef<number[]>([]);

    const { result, chest_type } = props.opening;
    const item = getItem(result.item_id);
    const rarity = result.rarity;
    const is_legendary = rarity === 'legendary';
    const [sparks] = useState(() => buildSparks(SPARK_COUNT[rarity], result.item_id.length * 7 + tap_count));

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
            playSfx(is_legendary || rarity === 'epic' ? 'chime' : 'sparkle');
        }, BURST_MS);
        later(() => setIsButtonsReady(true), BURST_MS + BUTTONS_DELAY_MS);
    }

    function tapChest(): void
    {
        if (phase !== 'ready')
        {
            return;
        }
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
        if (is_legendary)
        {
            setPhase('dark');
            playSfx('rise');
            later(burst, DARK_MS);
            return;
        }
        burst();
    }

    // Dark while the legendary builds up and bursts; the light comes back with the item
    const is_dark = is_legendary && (phase === 'dark' || phase === 'burst');
    const is_revealed = phase === 'reveal';
    const show_chest = phase === 'enter' || phase === 'ready' || phase === 'dark';
    const rarity_color = RARITY_COLORS[rarity];

    // Shakes while waiting for taps, harder with every crack; trembles in the dark
    const shake = phase === 'dark'
        ? { x: [0, -4, 4, -6, 6, -8, 8, 0], transition: { duration: 0.5, repeat: Infinity } }
        : phase === 'ready'
            ? { x: [0, -(1 + tap_count * 1.5), 1 + tap_count * 1.5, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.6 - tap_count * 0.2 } }
            : { x: 0 };

    return (
        <motion.div
            className={`${styles.layer} ${styles[rarity]} ${is_dark ? styles.dark : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={t(chestNameKey(chest_type))}
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
                animate={phase === 'burst' || is_revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                transition={{ scale: SPRING_POP, opacity: { duration: 0.35 } }}
            >
                <Rays color={rarity_color} is_sketch={is_sketch} />
            </motion.div>

            <div className={styles.content}>
                <div className={styles.heading}>
                    <span className="mono_label">{t(chestNameKey(chest_type))}</span>
                </div>

                <div
                    {...getPressableProps(tapChest, phase !== 'ready')}
                    className={styles.stage}
                    aria-label={t('chest_tap_hint', { n: TAPS_TO_OPEN - tap_count })}
                >
                    {/* Flash in the rarity color when it bursts */}
                    <motion.div
                        className={styles.flash}
                        style={{ background: rarity_color }}
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={phase === 'burst' ? { opacity: [0, 0.9, 0], scale: [0.2, 2.4, 3.2] } : { opacity: 0, scale: 0.2 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />

                    <AnimatePresence>
                        {show_chest && (
                            <motion.div
                                key="chest"
                                initial={{ y: -260, rotate: -8 }}
                                animate={{ y: 0, rotate: 0 }}
                                exit={{ scale: 1.35, opacity: 0, transition: { duration: 0.18 } }}
                                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                            >
                                <motion.div animate={shake}>
                                    <div ref={jolt_scope} className={styles.chest_box}>
                                        {is_sketch ? <SketchChestArt size={CHEST_SIZE} /> : <ExtrudedChestArt size={CHEST_SIZE} />}
                                        <Cracks count={phase === 'dark' ? CRACKS.length : tap_count} color={rarity_color} is_sketch={is_sketch} is_glowing={phase === 'dark'} />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sparks fly out of the burst */}
                    {(phase === 'burst' || is_revealed) && sparks.map((spark, index) => (
                        <motion.svg
                            key={index}
                            className={styles.spark}
                            viewBox="0 0 20 20"
                            style={{ width: spark.size, height: spark.size, marginLeft: -spark.size / 2, marginTop: -spark.size / 2 }}
                            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
                            animate={{
                                x: Math.cos(spark.angle) * spark.distance,
                                y: Math.sin(spark.angle) * spark.distance + 40,
                                rotate: spark.spin,
                                opacity: 0,
                                scale: 1,
                            }}
                            transition={{ duration: 1.1, delay: spark.delay, ease: 'easeOut' }}
                            aria-hidden="true"
                        >
                            {is_sketch
                                ? <path d="M10 1 L12 8 L19 10 L12 12 L10 19 L8 12 L1 10 L8 8 Z" fill={rarity_color} stroke="#1f1c18" strokeWidth={1.4} strokeLinejoin="round" />
                                : <rect x="4" y="4" width="12" height="12" rx="2" fill={index % 3 === 0 ? '#ffffff' : rarity_color} />}
                        </motion.svg>
                    ))}

                    {/* The item rises out of where the chest was */}
                    {is_revealed && item && (
                        <motion.div
                            className={styles.gem_box}
                            initial={{ y: 60, scale: 0.2, rotate: -30 }}
                            animate={{ y: 0, scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 13 }}
                        >
                            {is_sketch ? <SketchRarityGem rarity={rarity} /> : <span className={styles.gem} />}
                        </motion.div>
                    )}

                    <HapticOverlay is_disabled={phase !== 'ready'} />
                </div>

                <div className={styles.details}>
                    {phase === 'ready' && (
                        <motion.span
                            key={tap_count}
                            className={`mono_label ${styles.tap_hint}`}
                            initial={{ y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                        >
                            {t('chest_tap_hint', { n: TAPS_TO_OPEN - tap_count })}
                        </motion.span>
                    )}
                    {is_revealed && item && (
                        <motion.div
                            className={styles.item_text}
                            initial={{ y: 16, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ y: SPRING_POP, opacity: OPACITY_FADE, delay: 0.2 }}
                        >
                            <span className={styles.rarity}>{t(`rarity_${rarity}`)}</span>
                            <h1 className={styles.name}>{t(itemNameKey(item.id))}</h1>
                            <span className={styles.slot}>{t(slotNameKey(item.slot))}</span>
                            <p className={styles.status}>
                                {result.is_duplicate ? t('reveal_duplicate', { n: result.shards_gained }) : t('reveal_new')}
                            </p>
                        </motion.div>
                    )}
                </div>

                <motion.div
                    className={styles.actions}
                    initial={{ y: 20, opacity: 0 }}
                    animate={is_buttons_ready ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                    style={{ pointerEvents: is_buttons_ready ? 'auto' : 'none' }}
                >
                    {item && canEquipNow(item) && (
                        equipped[item.slot] === item.id
                            ? <TactileButton size="md" is_full_width is_disabled>{t('reveal_equipped')}</TactileButton>
                            : <TactileButton size="md" variant="ink" is_full_width onClick={() => equip(item.id)}>{t('reveal_equip')}</TactileButton>
                    )}
                    {chests_left > 0 && (
                        <TactileButton size="md" is_full_width onClick={props.onOpenNext}>{t('chest_open_next', { n: chests_left })}</TactileButton>
                    )}
                    <TactileButton size="lg" variant="accent" is_full_width onClick={props.onClose}>{t('reveal_close')}</TactileButton>
                </motion.div>
            </div>
        </motion.div>
    );
}

interface CracksProps
{
    count: number;
    color: string;
    is_sketch: boolean;
    is_glowing: boolean;              // legendary build-up: the light gets stronger
}

// Cracks over the chest art: a wide stroke of the rarity color (light leaking
// out) under a thin dark line, each drawn in when it appears
function Cracks(props: CracksProps)
{
    return (
        <svg className={styles.cracks} viewBox="0 0 200 180" aria-hidden="true">
            {CRACKS.slice(0, props.count).map((d) => (
                <g key={d}>
                    <motion.path
                        d={d}
                        stroke={props.color}
                        strokeWidth={props.is_glowing ? 11 : 7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0.4 }}
                        animate={{ pathLength: 1, opacity: props.is_glowing ? [0.6, 1, 0.6] : 0.65 }}
                        transition={{ pathLength: { duration: 0.18 }, opacity: props.is_glowing ? { duration: 0.4, repeat: Infinity } : { duration: 0.2 } }}
                    />
                    <motion.path
                        d={d}
                        stroke={props.is_sketch ? '#1f1c18' : '#3b2508'}
                        strokeWidth={props.is_sketch ? 2.6 : 2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.18 }}
                    />
                </g>
            ))}
        </svg>
    );
}

interface RaysProps
{
    color: string;
    is_sketch: boolean;
}

// Sunburst: solid wedges in the 3D theme, loose marker strokes in the sketch theme
function Rays(props: RaysProps)
{
    const rays = Array.from({ length: RAY_COUNT }, (_, index) => (index / RAY_COUNT) * Math.PI * 2);
    return (
        <svg className={styles.rays} viewBox="-100 -100 200 200" aria-hidden="true">
            {props.is_sketch
                ? rays.map((angle, index) => (
                    <path
                        key={index}
                        d={`M${(Math.cos(angle) * 30).toFixed(1)} ${(Math.sin(angle) * 30).toFixed(1)} L${(Math.cos(angle + 0.03) * (78 + (index % 3) * 8)).toFixed(1)} ${(Math.sin(angle + 0.03) * (78 + (index % 3) * 8)).toFixed(1)}`}
                        stroke={props.color}
                        strokeWidth={index % 2 === 0 ? 1.5 : 0.9}
                        strokeLinecap="round"
                        opacity={0.6}
                    />
                ))
                : rays.map((angle, index) => (
                    <path
                        key={index}
                        d={`M0 0 L${(Math.cos(angle - 0.09) * 100).toFixed(1)} ${(Math.sin(angle - 0.09) * 100).toFixed(1)} L${(Math.cos(angle + 0.09) * 100).toFixed(1)} ${(Math.sin(angle + 0.09) * 100).toFixed(1)} Z`}
                        fill={props.color}
                        opacity={0.22}
                    />
                ))}
        </svg>
    );
}
