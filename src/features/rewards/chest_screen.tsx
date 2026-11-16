import { useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { Screen } from '../../ui/screen';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { playSfx } from '../../sound/sfx_engine';
import { triggerHaptic } from '../../sound/haptic_hack';
import { ChestArt } from './chest_art';
import styles from './chest_screen.module.css';

// Rewards tab. Phase 0: the chest (tap it: it rattles but stays locked)
// and a teaser of what can drop. Real chests + gacha arrive in phase 4.

interface RarityTeaser
{
    key: 'common' | 'rare' | 'epic' | 'legendary';
    label: string;
    rate: string;
    example: string;
}

// Mirrors the daily chest rates in the plan (reward_config.ts in phase 1)
const RARITY_TEASERS: RarityTeaser[] = [
    { key: 'common', label: 'Thường', rate: '60%', example: 'Danh hiệu' },
    { key: 'rare', label: 'Hiếm', rate: '28%', example: 'Theme' },
    { key: 'epic', label: 'Sử thi', rate: '10%', example: 'Skin đồng hồ' },
    { key: 'legendary', label: 'Huyền thoại', rate: '2%', example: 'Lửa hiếm' },
];

const CHEST_COUNT = 0;

export function ChestScreen()
{
    const chest_controls = useAnimationControls();
    const [tap_count, setTapCount] = useState(0);

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

    return (
        <Screen kicker="Kho báu" title="Rương">
            <div className={styles.hero}>
                <div className={styles.glow} />
                <motion.button
                    type="button"
                    className={styles.chest_button}
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                    onClick={rattleChest}
                    aria-label="Rương (đang khóa)"
                >
                    <motion.div animate={chest_controls}>
                        <ChestArt size={210} />
                    </motion.div>
                </motion.button>
                <div className={styles.shadow} />
            </div>

            <div className={styles.ribbon_row}>
                <Ribbon color="ink">{CHEST_COUNT} rương đang chờ</Ribbon>
            </div>

            <div className={styles.words}>
                <TypewriterText
                    key={tap_count > 2 ? 'nudge' : 'intro'}
                    text={tap_count > 2 ? 'Lắc hoài cũng không mở đâu.\nĐi học đi rồi tính 😏' : 'Đạt mục tiêu hôm nay\nđể nhận rương đầu tiên.'}
                    start_delay_ms={200}
                />
            </div>

            <span className={`mono_label ${styles.section_label}`}>Có thể rơi ra</span>
            <div className={styles.grid}>
                {RARITY_TEASERS.map((rarity, index) => (
                    <motion.div
                        key={rarity.key}
                        className={`${styles.card} ${styles[rarity.key]}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.15 + index * 0.06 }}
                    >
                        <span className={styles.gem} />
                        <span className={styles.card_label}>{rarity.label}</span>
                        <span className={styles.card_example}>{rarity.example}</span>
                        <span className={styles.card_rate}>{rarity.rate}</span>
                    </motion.div>
                ))}
            </div>
        </Screen>
    );
}
