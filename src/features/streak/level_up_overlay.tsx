import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { OPACITY_FADE, SPRING_POP } from '../../ui/motion_presets';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { FLAME_TIERS, type LevelUp } from '../../core/flame_tiers';
import { useT } from '../../i18n/use_t';
import { tierNameKey, tierWordsKey } from '../../i18n/strings';
import { LowPolyFlame } from './low_poly_flame';
import { getFlameColors } from './flame_palettes';
import styles from './level_up_overlay.module.css';

// Full-screen level-up moment, in three beats:
// 1. charge: the old flame shakes and swells while a rising run of notes plays
// 2. burst:  it blows apart with a flash and a boom
// 3. reveal: the new flame assembles, its name, ribbon and words appear
// Rendered into <body> so it covers the tab bar and any transformed parent.

type Phase = 'charge' | 'burst' | 'reveal';

const CHARGE_MS = 1150;               // old flame shaking
const BURST_MS = 520;                 // facets flying apart before the new flame
const BUTTON_DELAY_MS = 1300;         // after reveal, so the moment is not skipped by accident

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
    const [is_button_ready, setIsButtonReady] = useState(false);
    const new_tier = FLAME_TIERS[props.level_up.to_index];
    const new_colors = getFlameColors(props.level_up.to_index, props.color_id);

    // One timeline per level-up: timers are set once on mount
    useEffect(() =>
    {
        playSfx('rise');
        const timers = [
            window.setTimeout(() =>
            {
                setPhase('burst');
                playSfx('burst');
                triggerHaptic();
            }, CHARGE_MS),
            window.setTimeout(() =>
            {
                setPhase('reveal');
                playSfx('sparkle');
            }, CHARGE_MS + BURST_MS),
            window.setTimeout(() => setIsButtonReady(true), CHARGE_MS + BURST_MS + BUTTON_DELAY_MS),
        ];
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, []);

    const is_revealed = phase === 'reveal';

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

                <div className={styles.flame_area}>
                    {/* White flash right when the old flame bursts */}
                    <motion.div
                        className={styles.flash}
                        initial={{ opacity: 0, scale: 0.2 }}
                        animate={phase === 'burst'
                            ? { opacity: [0, 1, 0], scale: [0.2, 1.6, 2.2] }
                            : { opacity: 0, scale: 0.2 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                    />

                    <motion.div
                        // Shakes harder and swells while charging
                        animate={phase === 'charge'
                            ? { x: [0, -2, 2, -3, 3, -5, 5, -7, 7, 0], scale: [1, 1.02, 1.05, 1.08, 1.12] }
                            : { x: 0, scale: 1 }}
                        transition={phase === 'charge'
                            ? { duration: CHARGE_MS / 1000, ease: 'easeIn' }
                            : SPRING_POP}
                    >
                        {is_revealed
                            ? <LowPolyFlame key="new" tier_index={props.level_up.to_index} color_id={props.color_id} />
                            : (
                                <LowPolyFlame
                                    key="old"
                                    tier_index={props.level_up.from_index}
                                    color_id={props.color_id}
                                    is_bursting={phase === 'burst'}
                                />
                            )}
                    </motion.div>
                </div>

                <div className={styles.details}>
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
