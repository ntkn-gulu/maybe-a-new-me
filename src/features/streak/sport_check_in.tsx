import { useState } from 'react';
import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { ModalCard } from '../../ui/modal_card';
import { Ribbon } from '../../ui/ribbon';
import { playSfx } from '../../sound/sfx_engine';
import { SPORT_ACTIVITIES, MIN_CHECK_IN_NOTE_LENGTH, isCheckInNoteValid } from '../../core/sport_rules';
import type { SportActivity } from '../../core/types';
import { useProgressStore, type TodayProgress } from '../../stores/progress_store';
import { useT } from '../../i18n/use_t';
import { sportActivityKey } from '../../i18n/strings';
import styles from './sport_check_in.module.css';

// Sport-day card on the Journey tab. Rendered on a sport day, or as a dev
// preview on any day (the check-in card opens, but saving stores nothing).
// Before the check-in: a button that opens the check-in card (activity + one line).
// After: what was trained and how many sessions are still needed.

const ACTIVITY_ICONS: Record<SportActivity, string> = {
    badminton: '🏸',
    gym: '🏋️',
    home_workout: '🏠',
    running: '🏃',
    other: '✨',
};

const NOTE_MAX_LENGTH = 80;

interface SportCheckInProps
{
    today: TodayProgress;
    is_preview?: boolean;         // dev: try the check-in card on a normal day
}

export function SportCheckIn(props: SportCheckInProps)
{
    const t = useT();
    const checkInSport = useProgressStore((state) => state.checkInSport);
    const [is_open, setIsOpen] = useState(false);
    const [activity, setActivity] = useState<SportActivity | null>(null);
    const [note, setNote] = useState('');

    const check_in = props.today.sport_check_in;
    const can_save = activity !== null && isCheckInNoteValid(note);

    function openSheet(): void
    {
        setActivity(null);
        setNote('');
        setIsOpen(true);
    }

    function chooseActivity(choice: SportActivity): void
    {
        playSfx('tab');
        setActivity(choice);
    }

    function save(): void
    {
        if (!activity || !can_save)
        {
            return;
        }
        if (props.is_preview)
        {
            setIsOpen(false);
            playSfx('tab');
            return;
        }
        checkInSport({ day_key: props.today.today, activity, note: note.trim() });
        setIsOpen(false);
        playSfx('sparkle');
    }

    return (
        <section className={styles.card}>
            <div className={styles.header}>
                <span className={styles.badge}>{check_in ? ACTIVITY_ICONS[check_in.activity] : '🏸'}</span>
                <div className={styles.header_text}>
                    <span className="mono_label">{t('sport_kicker')}</span>
                    <span className={styles.title}>
                        {check_in
                            ? t('sport_checked_in', { activity: t(sportActivityKey(check_in.activity)) })
                            : t('sport_hint')}
                    </span>
                </div>
            </div>

            {check_in === null && (
                <TactileButton variant="accent" is_full_width onClick={openSheet}>
                    {t('sport_check_in')}
                </TactileButton>
            )}

            {check_in !== null && (
                <motion.div
                    className={styles.result}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className={styles.note}>“{check_in.note}”</p>
                    {props.today.is_kept
                        ? <Ribbon color="flame">🔥 {t('done_ribbon')}</Ribbon>
                        : <span className="mono_label">{t('sport_kept_hint', { n: props.today.sessions_to_keep })}</span>}
                </motion.div>
            )}

            <ModalCard is_open={is_open} onClose={() => setIsOpen(false)} aria_label={t('sport_sheet_title')}>
                <span className="mono_label">{t('sport_sheet_kicker')}</span>
                <h2 className={styles.sheet_title}>{t('sport_sheet_title')}</h2>

                <div className={styles.activities} role="radiogroup">
                    {SPORT_ACTIVITIES.map((choice) => (
                        <TactileButton
                            key={choice}
                            size="sm"
                            is_selected={choice === activity}
                            onClick={() => chooseActivity(choice)}
                        >
                            {ACTIVITY_ICONS[choice]} {t(sportActivityKey(choice))}
                        </TactileButton>
                    ))}
                </div>

                <input
                    className={styles.note_input}
                    value={note}
                    maxLength={NOTE_MAX_LENGTH}
                    placeholder={t('sport_note_placeholder')}
                    enterKeyHint="done"
                    onChange={(event) => setNote(event.target.value)}
                    onKeyDown={(event) =>
                    {
                        if (event.key === 'Enter')
                        {
                            save();
                        }
                    }}
                />
                <span className={isCheckInNoteValid(note) ? `${styles.hint} ${styles.hint_ok}` : styles.hint}>
                    {isCheckInNoteValid(note) ? '✓' : t('note_min_hint', { n: MIN_CHECK_IN_NOTE_LENGTH })}
                </span>

                <div className={styles.actions}>
                    <TactileButton onClick={() => setIsOpen(false)}>{t('sport_cancel')}</TactileButton>
                    <TactileButton variant="accent" is_full_width is_disabled={!can_save} onClick={save}>
                        {t('sport_save')}
                    </TactileButton>
                </div>
            </ModalCard>
        </section>
    );
}
