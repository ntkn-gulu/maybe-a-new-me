import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { TypewriterText } from '../../ui/typewriter_text';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import type { BreakReason } from '../../core/session_rules';
import { detectDevice } from '../../stores/clock';
import { useFocusStore } from '../../stores/focus_store';
import { useArtStyle, useSettingsStore } from '../../stores/settings_store';
import { ShatteredDial } from './shattered_dial';
import { ExtrudedShatteredDial } from './extruded_shattered_dial';
import styles from './focus_session.module.css';

// A broken session: the dial shatters, the reason sits on a card,
// and a calm line says it's fine to go again.

const REASON_KEYS: Record<BreakReason, StringKey> = {
    left_app: 'broken_left_app',
    away_too_long: 'broken_away_too_long',
    missed_check: 'broken_missed_check',
    clock_jump: 'broken_clock_jump',
    gave_up: 'broken_gave_up',
};

const REASON_ICONS: Record<BreakReason, string> = {
    left_app: '🚪',
    away_too_long: '⏳',
    missed_check: '😴',
    clock_jump: '🕰️',
    gave_up: '🏳️',
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
    const art_style = useArtStyle();

    function retry(): void
    {
        start(detectDevice(), is_dev_mode);
    }

    return (
        <div className={styles.paper}>
            <span className="mono_label">{t('broken_kicker')}</span>
            <h2 className={styles.paper_title}>{t('broken_title')}</h2>

            {art_style === 'extruded' ? <ExtrudedShatteredDial /> : <ShatteredDial />}

            {props.reason && (
                <motion.div
                    className={styles.reason_card}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ y: { type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }, opacity: { duration: 0.2, delay: 0.6 } }}
                >
                    <span className={styles.reason_icon} aria-hidden="true">{REASON_ICONS[props.reason]}</span>
                    <span className={styles.reason_text}>{t(REASON_KEYS[props.reason])}</span>
                </motion.div>
            )}

            <div className={styles.broken_words}>
                <TypewriterText text={t('broken_encourage')} start_delay_ms={900} />
            </div>

            <div className={styles.paper_actions}>
                <TactileButton variant="accent" size="lg" is_full_width onClick={retry}>
                    {t('broken_retry')}
                </TactileButton>
                <TactileButton size="md" is_full_width onClick={dismiss}>
                    {t('broken_back')}
                </TactileButton>
            </div>
        </div>
    );
}
