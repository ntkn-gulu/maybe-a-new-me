import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { useT } from '../../i18n/use_t';
import { useTodayProgress } from '../../stores/progress_store';
import { useFocusStore } from '../../stores/focus_store';
import styles from './focus_session.module.css';

// Celebration after a saved session: today's pips fill up one by one and,
// when the goal is reached, the "flame kept today" ribbon pops in.

export function SessionDone()
{
    const t = useT();
    const dismiss = useFocusStore((state) => state.dismiss);
    const today = useTodayProgress();
    const sessions_left = today.sessions_to_keep;

    return (
        <motion.div
            className={styles.paper}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <span className="mono_label">{t('done_kicker')}</span>
            <h2 className={styles.paper_title}>{t('done_title')}</h2>

            <div className={styles.done_pips}>
                {Array.from({ length: Math.max(today.target, today.done) }, (_, index) =>
                {
                    const is_filled = index < today.done;
                    const is_new = index === today.done - 1;
                    return (
                        <motion.span
                            key={index}
                            className={is_filled ? `${styles.done_pip} ${styles.done_pip_filled} sk-frame sk-flat` : `${styles.done_pip} sk-frame sk-flat`}
                            initial={is_new ? { scale: 0.2, rotate: -30 } : false}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.35 }}
                        />
                    );
                })}
            </div>

            {today.is_kept && (
                <div className={styles.done_ribbon}>
                    <Ribbon color="flame">🔥 {t('done_ribbon')}</Ribbon>
                </div>
            )}

            <div className={styles.done_words}>
                <TypewriterText
                    text={today.is_kept ? t('done_goal_met') : t('done_goal_left', { n: sessions_left })}
                    start_delay_ms={600}
                />
            </div>

            <div className={styles.paper_actions}>
                <TactileButton variant="ink" size="lg" is_full_width onClick={dismiss}>
                    {t('done_continue')}
                </TactileButton>
            </div>
        </motion.div>
    );
}
