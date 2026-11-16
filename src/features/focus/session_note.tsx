import { useState } from 'react';
import { motion } from 'motion/react';
import { TactileButton } from '../../ui/tactile_button';
import { useT } from '../../i18n/use_t';
import { isNoteValid, MIN_NOTE_LENGTH } from '../../core/session_rules';
import { useFocusStore } from '../../stores/focus_store';
import styles from './focus_session.module.css';

// Time is up: one honest line about what was done, then the session counts.

export function SessionNote()
{
    const t = useT();
    const submitNote = useFocusStore((state) => state.submitNote);
    const [note, setNote] = useState('');
    const is_valid = isNoteValid(note);

    return (
        <motion.div
            className={styles.paper}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
            <span className="mono_label">{t('note_kicker')}</span>
            <h2 className={styles.paper_title}>{t('note_title')}</h2>

            <textarea
                className={styles.note_input}
                value={note}
                maxLength={140}
                rows={3}
                placeholder={t('note_placeholder')}
                onChange={(event) => setNote(event.target.value)}
            />
            <span className={is_valid ? `${styles.note_hint} ${styles.note_hint_ok}` : styles.note_hint}>
                {is_valid ? '✓' : t('note_min_hint', { n: MIN_NOTE_LENGTH })}
            </span>

            <div className={styles.paper_actions}>
                <TactileButton variant="accent" size="lg" is_full_width is_disabled={!is_valid} onClick={() => submitNote(note)}>
                    {t('note_save')}
                </TactileButton>
            </div>
        </motion.div>
    );
}
