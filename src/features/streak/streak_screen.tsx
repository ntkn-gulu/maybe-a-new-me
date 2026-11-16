import { motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import styles from './streak_screen.module.css';

// Streak tab. Phase 0 shows a simple flickering ember;
// the 9-tier flame, calendar and level-up arrive in phase 3.

// Flicker loop: small random-looking scale/skew changes on a long cycle
const FLICKER_DURATION_SECONDS = 2.4;

export function StreakScreen()
{
    return (
        <Screen title="Lửa" subtitle="Giữ lửa mỗi ngày bằng cách đạt mục tiêu">
            <div className={styles.stage}>
                <div className={styles.glow} />
                <motion.svg
                    className={styles.ember}
                    viewBox="0 0 120 160"
                    animate={{
                        scaleY: [1, 1.06, 0.97, 1.04, 1],
                        scaleX: [1, 0.96, 1.03, 0.98, 1],
                        skewX: [0, -2, 1.5, -1, 0],
                    }}
                    transition={{ duration: FLICKER_DURATION_SECONDS, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ originY: 1 }}
                >
                    <defs>
                        <linearGradient id="ember-outer" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#8a3a12" />
                            <stop offset="100%" stopColor="#d9783a" />
                        </linearGradient>
                        <linearGradient id="ember-inner" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#d9783a" />
                            <stop offset="100%" stopColor="#ffd2a1" />
                        </linearGradient>
                    </defs>
                    <path d="M60 8c8 30 44 50 44 94a44 44 0 0 1-88 0c0-22 10-36 21-47 2 15 9 22 16 25-5-28 3-52 7-72z" fill="url(#ember-outer)" />
                    <path d="M60 80c5 15 22 23 22 44a22 22 0 0 1-44 0c0-13 8-21 13-27 1 8 5 11 9 12-2-11 0-21 0-29z" fill="url(#ember-inner)" />
                </motion.svg>
            </div>

            <div className={styles.count_block}>
                <span className={styles.count}>0</span>
                <span className={styles.count_label}>ngày liên tiếp</span>
            </div>

            <p className={styles.hint}>Tàn Lửa · còn 3 ngày nữa để lên Lửa Cam</p>
        </Screen>
    );
}
