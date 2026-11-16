import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import type { BreakReason } from '../../core/session_rules';
import { detectDevice } from '../../stores/clock';
import { useFocusStore } from '../../stores/focus_store';
import { useSettingsStore } from '../../stores/settings_store';
import styles from './focus_session.module.css';

// A broken session: the dial cracks and shakes, the reason is shown plainly.

const REASON_KEYS: Record<BreakReason, StringKey> = {
    left_app: 'broken_left_app',
    away_too_long: 'broken_away_too_long',
    missed_check: 'broken_missed_check',
    clock_jump: 'broken_clock_jump',
    gave_up: 'broken_gave_up',
};

interface SessionBrokenProps
{
    reason: BreakReason | null;
}

export function SessionBroken(props: SessionBrokenProps)
{
    const t = useT();
    const dismiss = useFocusStore((state) => state.dismiss);
    const start = useFocusStore((state) => state.start);
    const is_dev_mode = useSettingsStore((state) => state.is_dev_mode);

    function retry(): void
    {
        start(detectDevice(), is_dev_mode);
    }

    return (
        <motion.div className={styles.paper} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.svg
                className={styles.cracked_dial}
                viewBox="0 0 120 120"
                aria-hidden="true"
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -6, 5, -3, 2, 0], x: [0, -6, 5, -3, 0] }}
                transition={{ duration: 0.5 }}
            >
                <circle cx="60" cy="64" r="50" fill="#d9cfbf" />
                <circle cx="60" cy="58" r="50" fill="var(--tile-face)" />
                <circle cx="60" cy="58" r="36" fill="var(--color-pink)" />
                <polyline points="60,8 54,30 66,44 52,62 63,78 56,108" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
                <polyline points="66,44 86,50 98,40" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
                <polyline points="52,62 34,66 22,80" fill="none" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
            </motion.svg>

            <span className="mono_label">{t('broken_kicker')}</span>
            <h2 className={styles.paper_title}>{t('broken_title')}</h2>
            {props.reason && <p className={styles.broken_reason}>{t(REASON_KEYS[props.reason])}</p>}

            <div className={styles.paper_actions}>
                <TactileButton variant="accent" size="lg" is_full_width onClick={retry}>
                    {t('broken_retry')}
                </TactileButton>
                <TactileButton size="md" is_full_width onClick={dismiss}>
                    {t('broken_back')}
                </TactileButton>
            </div>
        </motion.div>
    );
}
