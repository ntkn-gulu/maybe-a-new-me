import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useAnimate, type TargetAndTransition, type Transition } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { FLAME_TIERS, type LevelUp } from '../../core/flame_tiers';
import { useT } from '../../i18n/use_t';
import { tierNameKey, tierWordsKey } from '../../i18n/strings';
import { Flame } from './flame';
import { getFlameColors } from './flame_palettes';
import styles from './level_up_overlay.module.css';

// Full-screen level-up moment, in four beats:
// 1. charge: the old flame shakes and swells while a rising run of notes plays
// 2. ready:  the user taps the flame TAPS_TO_BURST times; each tap jolts and
//            cracks it. The finger lands on a HapticOverlay, so iPhones buzz on
//            every tap (iOS never lets a page vibrate on its own).
// 3. burst:  on the last tap it blows apart with a flash and a boom
// 4. reveal: the new flame assembles, its name, ribbon and words appear
// Rendered into <body> so it covers the tab bar and any transformed parent.

type Phase = 'charge' | 'ready' | 'burst' | 'reveal';

const CHARGE_MS = 1150;               // old flame shaking before taps are accepted
const BURST_MS = 520;                 // facets flying apart before the new flame
const BUTTON_DELAY_MS = 1300;         // after reveal, so the moment is not skipped by accident
const TAPS_TO_BURST = 3;
const CHARGED_SCALE = 1.1;            // flame size once charged
const TAP_SCALE_STEP = 0.06;          // extra swell per tap
const TAP_CRACK_LOUDNESS = [0.35, 0.6];   // crack sound for each tap before the burst

interface LevelUpOverlayProps
{
    level_up: LevelUp | null;         // null = closed
    color_id?: string | null;         // equipped flame color item
    onClose: () => void;
}

export function LevelUpOverlay(props: LevelUpOverlayProps)
{
    return createPortal(
        <AnimatePresence>
            {props.level_up && (
                <LevelUpStage
                    key={`${props.level_up.from_index}-${props.level_up.to_index}`}
                    level_up={props.level_up}
                    color_id={props.color_id ?? null}
                    onClose={props.onClose}
                />
            )}
        </AnimatePresence>,
        document.body,
    );
}

interface LevelUpStageProps
{
    level_up: LevelUp;
    color_id: string | null;
    onClose: () => void;
}

function LevelUpStage(props: LevelUpStageProps)
{
    const t = useT();
    const [phase, setPhase] = useState<Phase>('charge');
    const [tap_count, setTapCount] = useState(0);
    const [is_button_ready, setIsButtonReady] = useState(false);
    const [jolt_scope, animateJolt] = useAnimate<HTMLDivElement>();
    const timers = useRef<number[]>([]);
    const new_tier = FLAME_TIERS[props.level_up.to_index];
    const new_colors = getFlameColors(props.level_up.to_index, props.color_id);

    function later(callback: () => void, delay_ms: number): void
    {
        timers.current.push(window.setTimeout(callback, delay_ms));
    }

    useEffect(() =>
    {
        playSfx('rise');
        const charge_timer = window.setTimeout(() => setPhase('ready'), CHARGE_MS);
        const pending = timers.current;
        return () =>
        {
            window.clearTimeout(charge_timer);
            pending.forEach((timer) => window.clearTimeout(timer));
        };
    }, []);

    function tapFlame(): void
    {
        if (phase !== 'ready')
        {
            return;
        }
        triggerHaptic();                          // Android; iPhones buzz through the HapticOverlay
        const next_count = tap_count + 1;
        setTapCount(next_count);

        if (next_count < TAPS_TO_BURST)
        {
            playSfx('crack', TAP_CRACK_LOUDNESS[next_count - 1]);
            // Alternate the jolt direction so each tap feels like a new hit
            const direction = next_count % 2 === 0 ? 1 : -1;
            animateJolt(jolt_scope.current, { rotate: [0, 9 * direction, -6 * direction, 2 * direction, 0] }, { duration: 0.35 });
            return;
        }

        setPhase('burst');
        playSfx('burst');
        later(() =>
        {
            setPhase('reveal');
            playSfx('sparkle');
        }, BURST_MS);
        later(() => setIsButtonReady(true), BURST_MS + BUTTON_DELAY_MS);
    }

    const is_revealed = phase === 'reveal';
    const is_ready = phase === 'ready';
    const charged_scale = CHARGED_SCALE + tap_count * TAP_SCALE_STEP;

    let swell_animate: TargetAndTransition;
    let swell_transition: Transition;
    if (phase === 'charge')
    {
        // Shakes harder and swells while charging
        swell_animate = { x: [0, -2, 2, -3, 3, -5, 5, -7, 7, 0], scale: [1, 1.02, 1.05, 1.08, CHARGED_SCALE] };
        swell_transition = { duration: CHARGE_MS / 1000, ease: 'easeIn' };
    }
    else if (is_ready)
    {
        // Breathes while waiting for taps; each tap makes it a bit bigger
        swell_animate = { x: 0, scale: [charged_scale, charged_scale + 0.03, charged_scale] };
        swell_transition = { duration: 0.9, repeat: Infinity, ease: 'easeInOut' };
    }
    else
    {
        swell_animate = { x: 0, scale: 1 };
        swell_transition = SPRING_POP;
    }

    return (
        <motion.div
            className={styles.layer}
            role="dialog"
            aria-modal="true"
            aria-label={t('level_up_kicker')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* Slowly turning sunburst in the new flame's glow color */}
            <motion.div
                className={styles.rays}
                style={{ '--ray-color': new_colors.glow } as CSSProperties}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={is_revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                transition={{ scale: SPRING_POP, opacity: { duration: 0.5 } }}
            />

            <div className={styles.content}>
                <div className={styles.heading}>
                    <AnimatePresence>
                        {is_revealed && (
                            <motion.div
                                className={styles.heading_inner}
                                initial={{ y: -24, scale: 0.8, opacity: 0 }}
                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                transition={{ y: SPRING_POP, scale: SPRING_POP, opacity: OPACITY_FADE, delay: 0.25 }}
                            >
                                <span className="mono_label">{t('level_up_kicker')}</span>
                                <h1 className={styles.tier_name}>{t(tierNameKey(new_tier.index))}</h1>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* The whole flame area is the tap target while waiting for taps */}
                <div
                    {...getPressableProps(tapFlame, !is_ready)}
                    className={is_ready ? `${styles.flame_area} ${styles.flame_area_ready}` : styles.flame_area}
                    aria-label={t('level_up_tap_hint', { n: TAPS_TO_BURST - tap_count })}
                >
                    {/* White flash right when the old flame bursts */}
                    <motion.div
                        className={styles.flash}
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={phase === 'burst'
                            ? { opacity: [0, 1, 0], scale: [0.2, 1.6, 2.2] }
                            : { opacity: 0, scale: 0.2 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                    />

                    <motion.div animate={swell_animate} transition={swell_transition}>
                        <div ref={jolt_scope}>
                            {is_revealed
                                ? <Flame key="new" tier_index={props.level_up.to_index} color_id={props.color_id} />
                                : (
                                    <Flame
                                        key="old"
                                        tier_index={props.level_up.from_index}
                                        color_id={props.color_id}
                                        is_bursting={phase === 'burst'}
                                    />
                                )}
                        </div>
                    </motion.div>

                    <HapticOverlay is_disabled={!is_ready} />
                </div>

                <div className={styles.details}>
                    {is_ready && (
                        <motion.span
                            key={tap_count}
                            className={`mono_label ${styles.tap_hint}`}
                            initial={{ y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                        >
                            {t('level_up_tap_hint', { n: TAPS_TO_BURST - tap_count })}
                        </motion.span>
                    )}
                    {is_revealed && (
                        <>
                            <Ribbon color="flame">{t('level_up_ribbon', { level: new_tier.index, n: new_tier.min_days })}</Ribbon>
                            <TypewriterText text={t(tierWordsKey(new_tier.index))} start_delay_ms={700} />
                        </>
                    )}
                </div>

                <motion.div
                    className={styles.actions}
                    initial={{ y: 20, opacity: 0 }}
                    animate={is_button_ready ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                    transition={{ y: SPRING_POP, opacity: OPACITY_FADE }}
                    style={{ pointerEvents: is_button_ready ? 'auto' : 'none' }}
                >
                    <TactileButton variant="accent" size="lg" is_full_width onClick={props.onClose}>
                        {t('level_up_continue')}
                    </TactileButton>
                </motion.div>
            </div>
        </motion.div>
    );
}
