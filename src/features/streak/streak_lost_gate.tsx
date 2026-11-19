import { motion } from 'motion/react';
import { ModalCard } from '../../ui/modal_card';
import { TactileButton } from '../../ui/tactile_button';
import { FREEZE_EARN_EVERY_DAYS } from '../../core/streak_engine';
import { useT } from '../../i18n/use_t';
import { useProgressStore, useStreak, useStreakBreak } from '../../stores/progress_store';
import { useFocusStore } from '../../stores/focus_store';
import { useSettingsStore } from '../../stores/settings_store';
import { useArtStyle } from '../../stores/active_theme';
import { MYSTERY_COLORS } from './flame_palettes';
import { MiniFlame } from './mini_flame';
import styles from './streak_lost_gate.module.css';

// When a streak has just been broken (yesterday was a miss), a gentle card
// shows once: the flame is out (charcoal, a wisp of smoke rising), how long
// the streak was, that the best streak and every item are kept, and how a
// Streak Freeze saves a missed day. No guilt, one button to start again.
// Waits for onboarding and any focus session screen to be closed.

// Smoke wisps: [path, delay s]
const WISPS: [string, number][] = [
    ['M30 60 C22 48 38 40 30 28 C24 18 34 10 30 2', 0],
    ['M42 60 C50 50 36 42 44 30 C50 22 40 14 46 6', 0.9],
];

export function StreakLostGate()
{
    const t = useT();
    const art_style = useArtStyle();
    const streak_break = useStreakBreak();
    const best_streak = useStreak().best_streak;
    const consoled_break_day = useProgressStore((state) => state.consoled_break_day);
    const setConsoledBreak = useProgressStore((state) => state.setConsoledBreak);
    const has_session = useFocusStore((state) => state.session !== null);
    const has_seen_onboarding = useSettingsStore((state) => state.has_seen_onboarding);

    const is_open = streak_break !== null
        && streak_break.break_day !== consoled_break_day
        && !has_session
        && has_seen_onboarding;

    function close(): void
    {
        if (streak_break)
        {
            setConsoledBreak(streak_break.break_day);
        }
    }

    return (
        <ModalCard is_open={is_open} onClose={close} aria_label={t('streak_lost_kicker')}>
            <div className={styles.card}>
                <div className={styles.ember}>
                    <svg className={styles.smoke} viewBox="0 0 72 64" aria-hidden="true">
                        {WISPS.map(([d, delay]) => (
                            <motion.path
                                key={d}
                                d={d}
                                fill="none"
                                stroke="var(--color-ink-faint)"
                                strokeWidth={3}
                                strokeLinecap="round"
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: [10, -6], opacity: [0, 0.7, 0] }}
                                transition={{ duration: 2.4, delay, repeat: Infinity, ease: 'easeOut' }}
                            />
                        ))}
                    </svg>
                    <MiniFlame colors={MYSTERY_COLORS} art_style={art_style} className={styles.flame} />
                </div>
                <span className="mono_label">{t('streak_lost_kicker')}</span>
                <h2 className={styles.title}>{t('streak_lost_title', { n: streak_break?.lost_streak ?? 0 })}</h2>
                <p className={styles.body}>{t('streak_lost_body', { best: best_streak })}</p>
                <p className={`${styles.tip} sk-frame sk-flat`}>{t('streak_lost_tip', { n: FREEZE_EARN_EVERY_DAYS })}</p>
                <TactileButton size="lg" variant="accent" is_full_width onClick={close}>{t('streak_lost_button')}</TactileButton>
            </div>
        </ModalCard>
    );
}
