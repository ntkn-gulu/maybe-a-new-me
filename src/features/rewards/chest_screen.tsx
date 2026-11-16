import { motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import { ChestIcon } from '../../ui/icons';
import styles from './chest_screen.module.css';

// Rewards tab. Phase 0 shows the empty state; chests, gacha
// opening animation and the collection arrive in phase 4.

const IDLE_WOBBLE_SECONDS = 3.2;

export function ChestScreen()
{
    return (
        <Screen title="Rương" subtitle="Mỗi ngày giữ lửa = 1 rương">
            <div className={styles.empty}>
                <motion.div
                    className={styles.chest}
                    animate={{ rotate: [0, -4, 4, -2, 0, 0, 0], y: [0, -6, 0, 0, 0, 0, 0] }}
                    transition={{ duration: IDLE_WOBBLE_SECONDS, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <ChestIcon size={88} />
                </motion.div>
                <p className={styles.title}>Chưa có rương nào</p>
                <p className={styles.caption}>Hoàn thành mục tiêu hôm nay để nhận rương đầu tiên.</p>
            </div>
        </Screen>
    );
}
