import { motion } from 'motion/react';
import { FREEZE_EARN_EVERY_DAYS, getFreezeCap } from '../../core/streak_engine';
import { SPRING_POP } from '../../ui/motion_presets';
import { useT } from '../../i18n/use_t';
import styles from './streak_stats.module.css';

// Two tiles under the flame: best streak ever, and streak freezes as little
// ice cubes (owned ones raised, empty slots sunken up to the current cap).

interface StreakStatsProps
{
    current_streak: number;
    best_streak: number;
    freezes_owned: number;
}

export function StreakStats(props: StreakStatsProps)
{
    const t = useT();
    const cap = getFreezeCap(props.current_streak);
    const is_full = props.freezes_owned >= cap;
    const days_to_next_freeze = FREEZE_EARN_EVERY_DAYS - (props.current_streak % FREEZE_EARN_EVERY_DAYS);

    return (
        <div className={styles.row}>
            <div className={`${styles.tile} sk-frame`}>
                <span className="mono_label">{t('journey_best')}</span>
                <span className={styles.big}>{props.best_streak}</span>
                <span className={styles.caption}>{t('journey_days', { n: props.best_streak })}</span>
            </div>

            <div className={`${styles.tile} sk-frame`}>
                <span className="mono_label">{t('journey_freezes')}</span>
                <div className={styles.cubes} aria-label={`${props.freezes_owned} / ${cap}`}>
                    {Array.from({ length: cap }, (_, index) => (
                        <motion.span
                            key={index}
                            className={index < props.freezes_owned ? `${styles.cube} ${styles.cube_owned}` : styles.cube}
                            initial={index < props.freezes_owned ? { scale: 0.3, rotate: -20 } : false}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ ...SPRING_POP, delay: 0.2 + index * 0.06 }}
                        />
                    ))}
                </div>
                <span className={styles.caption}>
                    {is_full ? t('journey_freeze_full') : t('journey_freeze_next', { n: days_to_next_freeze })}
                </span>
            </div>
        </div>
    );
}
