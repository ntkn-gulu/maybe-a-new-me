import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen } from '../../ui/screen';
import { Ribbon } from '../../ui/ribbon';
import { TypewriterText } from '../../ui/typewriter_text';
import { FLAME_TIERS, getTierProgress, type LevelUp } from '../../core/flame_tiers';
import { playSfx } from '../../sound/sfx_engine';
import { useDayRecords, useProgressStore, useStreak, useTodayProgress } from '../../stores/progress_store';
import { useSettingsStore } from '../../stores/settings_store';
import { useT } from '../../i18n/use_t';
import { tierNameKey, tierWordsKey } from '../../i18n/strings';
import { LowPolyFlame } from './low_poly_flame';
import { TierStrip } from './tier_strip';
import { StreakStats } from './streak_stats';
import { SportCheckIn } from './sport_check_in';
import { StreakCalendar } from './streak_calendar';
import { DevJourneyPanel } from './dev_journey_panel';
import { LevelUpOverlay } from './level_up_overlay';
import styles from './streak_screen.module.css';

// Journey tab. Top: the current flame, its words, progress to the next tier
// and a strip of every tier that can be tapped to preview.
// Below: sport-day check-in (sport days only), best streak + freezes, and the
// month calendar. In dev mode a panel can fake the streak and replay level-ups.
// The streak comes from real session history (progress_store + core/streak_engine).

const LAST_TIER_INDEX = FLAME_TIERS.length - 1;

export function StreakScreen()
{
    const t = useT();
    const streak = useStreak();
    const records = useDayRecords();
    const today = useTodayProgress();
    const first_day_key = useProgressStore((state) => state.first_day_key);
    const is_dev_mode = useSettingsStore((state) => state.is_dev_mode);

    // Dev-only overrides, never saved
    const [dev_streak, setDevStreak] = useState<number | null>(null);
    const [dev_color_id, setDevColorId] = useState<string | null>(null);
    const [dev_level_up, setDevLevelUp] = useState<LevelUp | null>(null);

    const shown_streak = is_dev_mode && dev_streak !== null ? dev_streak : streak.current_streak;
    const color_id = is_dev_mode ? dev_color_id : null;
    const progress = getTierProgress(shown_streak);
    const current_index = progress.current.index;

    const [selected_index, setSelectedIndex] = useState(current_index);
    // When the tier itself changes (dev slider, a new day), jump the preview to it
    const [tracked_index, setTrackedIndex] = useState(current_index);
    if (tracked_index !== current_index)
    {
        setTrackedIndex(current_index);
        setSelectedIndex(current_index);
    }

    const selected_tier = FLAME_TIERS[selected_index];
    const is_current = selected_index === current_index;
    const is_locked = selected_index > current_index;

    function selectTier(tier_index: number): void
    {
        if (tier_index === selected_index)
        {
            return;
        }
        playSfx('whoosh');
        setSelectedIndex(tier_index);
    }

    function playDevLevelUp(): void
    {
        const to_index = Math.max(1, current_index);
        setDevLevelUp({ from_index: to_index - 1, to_index });
    }

    const selected_name = t(tierNameKey(selected_index));

    let ribbon_text = t('journey_streak', { n: shown_streak });
    if (is_locked)
    {
        ribbon_text = t('journey_unlock_at', { n: selected_tier.min_days });
    }
    else if (!is_current)
    {
        ribbon_text = t('journey_passed');
    }

    return (
        <Screen kicker={t('journey_kicker', { level: selected_index, max: LAST_TIER_INDEX })} align="center">
            <AnimatePresence mode="wait" initial={false}>
                <motion.h1
                    key={selected_name}
                    className={styles.tier_name}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                >
                    {selected_name}
                </motion.h1>
            </AnimatePresence>

            <div className={styles.ribbon_row}>
                <Ribbon key={ribbon_text} color={is_locked ? 'ink' : 'blue'}>
                    {is_locked ? '🔒 ' : ''}{ribbon_text}
                </Ribbon>
            </div>

            <div className={is_locked ? `${styles.scene} ${styles.locked}` : styles.scene}>
                {/* Equipped colors only paint tiers already reached; previews show the tier's own colors */}
                <LowPolyFlame tier_index={selected_index} color_id={is_locked ? null : color_id} />
            </div>

            <div className={styles.words}>
                <TypewriterText text={t(tierWordsKey(selected_index))} start_delay_ms={350} />
            </div>

            {is_current && progress.next && (
                <div className={styles.progress}>
                    <div className={styles.counter}>
                        <span>{progress.days_into_tier}</span>
                        <span className={styles.counter_slash}>/</span>
                        <span>{progress.days_to_next}</span>
                    </div>
                    <div className={styles.bar}>
                        <motion.div
                            className={styles.bar_fill}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(progress.ratio * 100, 2)}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.4 }}
                        />
                    </div>
                    <span className="mono_label">{t('journey_next', { name: t(tierNameKey(progress.next.index)) })}</span>
                </div>
            )}

            <TierStrip
                reached_index={current_index}
                selected_index={selected_index}
                onSelect={selectTier}
            />

            <div className={styles.sections}>
                {today.is_sport_day && <SportCheckIn today={today} />}

                <StreakStats
                    current_streak={shown_streak}
                    best_streak={Math.max(streak.best_streak, shown_streak)}
                    freezes_owned={streak.freezes_owned}
                />

                <StreakCalendar
                    today={today.today}
                    first_day_key={first_day_key}
                    records={records}
                    day_results={streak.day_results}
                />

                {is_dev_mode && (
                    <DevJourneyPanel
                        streak={shown_streak}
                        is_faked={dev_streak !== null}
                        tier_index={current_index}
                        color_id={dev_color_id}
                        onStreakChange={setDevStreak}
                        onColorChange={setDevColorId}
                        onPlayLevelUp={playDevLevelUp}
                    />
                )}
            </div>

            <LevelUpOverlay level_up={dev_level_up} color_id={color_id} onClose={() => setDevLevelUp(null)} />
        </Screen>
    );
}
