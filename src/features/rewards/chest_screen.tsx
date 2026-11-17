import { useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Screen } from '../../ui/screen';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import { ChestArt } from './chest_art';
import { ExtrudedChestArt } from './extruded_chest_art';
import { useArtStyle } from '../../stores/settings_store';
import { getPressableProps } from '../../ui/pressable';
import { HapticOverlay } from '../../ui/haptic_overlay';
import styles from './chest_screen.module.css';

// Rewards tab. Phase 0: the chest (tap it: it rattles but stays locked)
// and a teaser of what can drop. Real chests + gacha arrive in phase 4.
// Higher rarities get louder card effects: epic shimmers, legendary has a
// rotating gold border, glow, twinkling sparkles and shiny text.

type RarityKey = 'common' | 'rare' | 'epic' | 'legendary';

interface RarityTeaser
{
    key: RarityKey;
    label_key: StringKey;
    example_key: StringKey;
    rate: string;
}

// Mirrors the daily chest rates in the plan (reward_config.ts in phase 1)
const RARITY_TEASERS: RarityTeaser[] = [
    { key: 'common', label_key: 'rarity_common', example_key: 'example_common', rate: '60%' },
    { key: 'rare', label_key: 'rarity_rare', example_key: 'example_rare', rate: '28%' },
    { key: 'epic', label_key: 'rarity_epic', example_key: 'example_epic', rate: '10%' },
    { key: 'legendary', label_key: 'rarity_legendary', example_key: 'example_legendary', rate: '2%' },
];

// Sparkle positions per rarity: [left %, top %, size px, delay s]
const SPARKLES: Record<RarityKey, [number, number, number, number][]> = {
    common: [],
    rare: [],
    epic: [[78, 58, 10, 0.4], [60, 20, 7, 1.6]],
    legendary: [[82, 52, 13, 0], [64, 18, 9, 0.7], [90, 80, 8, 1.3], [48, 70, 7, 1.9], [72, 84, 10, 2.4]],
};

const CHEST_COUNT = 0;
const NUDGE_AFTER_TAPS = 3;

export function ChestScreen()
{
    const t = useT();
    const chest_controls = useAnimationControls();
    const [tap_count, setTapCount] = useState(0);
    const art_style = useArtStyle();

    function rattleChest(): void
    {
        playSfx('press');
        triggerHaptic();
        setTapCount((count) => count + 1);
        void chest_controls.start({
            rotate: [0, -7, 6, -4, 3, 0],
            y: [0, -10, 0, -4, 0],
            transition: { duration: 0.45 },
        });
    }

    const is_nudging = tap_count >= NUDGE_AFTER_TAPS;

    return (
        <Screen kicker={t('rewards_kicker')} title={t('rewards_title')}>
            <div className={styles.hero}>
                <div className={styles.glow} />
                <motion.div
                    {...getPressableProps(rattleChest)}
                    className={styles.chest_button}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    aria-label={t('rewards_chest_label')}
                >
                    <motion.div animate={chest_controls}>
                        {art_style === 'extruded' ? <ExtrudedChestArt size={210} /> : <ChestArt size={210} />}
                    </motion.div>
                    <HapticOverlay />
                </motion.div>
                <div className={styles.shadow} />
            </div>

            <div className={styles.ribbon_row}>
                <Ribbon color="ink">{t('rewards_waiting', { n: CHEST_COUNT })}</Ribbon>
            </div>

            <div className={styles.words}>
                <TypewriterText
                    key={is_nudging ? 'nudge' : 'intro'}
                    text={is_nudging ? t('rewards_nudge') : t('rewards_intro')}
                    start_delay_ms={200}
                />
            </div>

            <span className={`mono_label ${styles.section_label}`}>{t('rewards_can_drop')}</span>
            <div className={styles.grid}>
                {RARITY_TEASERS.map((rarity, index) => (
                    <motion.div
                        key={rarity.key}
                        className={`${styles.card} ${styles[rarity.key]} sk-frame sk-flat`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 + index * 0.06 }}
                    >
                        <span className={styles.gem} />
                        <span className={styles.card_label}>{t(rarity.label_key)}</span>
                        <span className={styles.card_example}>{t(rarity.example_key)}</span>
                        <span className={styles.card_rate}>{rarity.rate}</span>
                        {SPARKLES[rarity.key].map(([left, top, size, delay], sparkle_index) => (
                            <span
                                key={sparkle_index}
                                className={styles.sparkle}
                                style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, animationDelay: `${delay}s` }}
                            />
                        ))}
                    </motion.div>
                ))}
            </div>
        </Screen>
    );
}
