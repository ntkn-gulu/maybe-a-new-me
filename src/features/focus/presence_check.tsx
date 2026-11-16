import { useEffect } from 'react';
import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { useT } from '../../i18n/use_t';
import { playSfx } from '../../sound/sfx_engine';
import { getElapsedSeconds, getResponseSeconds, type FocusGuardState } from '../../core/session_rules';
import { useFocusStore } from '../../stores/focus_store';
import styles from './focus_session.module.css';

// "Still there?" — a flashing screen with a chime that rings every few
// seconds and gets louder, for when you're deep in a book and not looking.

const RING_EVERY_MS = 8000;
const START_LOUDNESS = 0.6;
const LOUDNESS_STEP = 0.35;
const MAX_LOUDNESS = 2.2;

interface PresenceCheckProps
{
    due_at_second: number;
    session: FocusGuardState;
    now: number;
}

export function PresenceCheck(props: PresenceCheckProps)
{
    const t = useT();
    const answerCheck = useFocusStore((state) => state.answerCheck);

    // Ring right away, then louder every few seconds until answered
    useEffect(() =>
    {
        let loudness = START_LOUDNESS;
        playSfx('chime', loudness);
        const interval_id = window.setInterval(() =>
        {
            loudness = Math.min(MAX_LOUDNESS, loudness + LOUDNESS_STEP);
            playSfx('chime', loudness);
        }, RING_EVERY_MS);
        return () => window.clearInterval(interval_id);
    }, [props.due_at_second]);

    // Shown in real seconds (in dev mode session time runs faster)
    const session_seconds_left = props.due_at_second + getResponseSeconds(props.session) - getElapsedSeconds(props.session, props.now);
    const seconds_left = Math.max(0, Math.ceil(session_seconds_left / props.session.limit_scale));

    function answer(): void
    {
        playSfx('sparkle');
        answerCheck();
    }

    return (
        <div className={styles.presence}>
            <motion.div
                className={styles.presence_flash}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className={styles.presence_content}>
                <motion.h2
                    className={styles.presence_title}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                >
                    {t('presence_title')}
                </motion.h2>
                <span className={styles.presence_countdown}>{t('presence_countdown', { n: seconds_left })}</span>
                <TactileButton variant="ink" size="lg" is_full_width onClick={answer}>
                    {t('presence_button')}
                </TactileButton>
            </div>
        </div>
    );
}
