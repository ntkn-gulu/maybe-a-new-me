import { useRef, useState, type ChangeEvent } from 'react';
import { TactileButton } from '../../ui/tactile_button';
import { ModalCard } from '../../ui/modal_card';
import { playSfx } from '../../sound/sfx_engine';
import { useT } from '../../i18n/use_t';
import type { StringKey } from '../../i18n/strings';
import { formatDayMonth } from '../../i18n/date_format';
import type { BackupProblem, BackupSummary } from '../../core/backup';
import { useSettingsStore } from '../../stores/settings_store';
import { getDayKeyAt, getTodayKey } from '../../stores/clock';
import { readBackupFile, restoreBackup, saveBackupFile } from '../../stores/backup_storage';
import { SettingRow } from './setting_row';
import settings_styles from './settings_screen.module.css';
import styles from './backup_section.module.css';

// Settings → Your data: save a backup file (with the day of the last one,
// so it is easy to see when it is time again) and restore one. Restoring
// first shows what the file holds and asks once more, because it replaces
// everything on this phone and cannot be undone.

const PROBLEM_KEYS: Record<BackupProblem, StringKey> = {
    not_json: 'backup_problem_not_backup',
    not_backup: 'backup_problem_not_backup',
    newer_version: 'backup_problem_newer_version',
    missing_data: 'backup_problem_missing_data',
};

interface PendingRestore
{
    entries: Record<string, string>;
    summary: BackupSummary;
}

export function BackupSection()
{
    const t = useT();
    const date_format = useSettingsStore((state) => state.date_format);
    const last_backup_day = useSettingsStore((state) => state.last_backup_day);
    const markBackupSaved = useSettingsStore((state) => state.markBackupSaved);
    const file_input = useRef<HTMLInputElement>(null);
    const [problem, setProblem] = useState<BackupProblem | null>(null);
    const [pending, setPending] = useState<PendingRestore | null>(null);

    async function saveBackup(): Promise<void>
    {
        if (await saveBackupFile() === 'saved')
        {
            markBackupSaved(getTodayKey());
            playSfx('sparkle');
        }
    }

    async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void>
    {
        const file = event.target.files?.[0];
        event.target.value = '';                  // the same file can be picked again later
        if (!file)
        {
            return;
        }
        const result = await readBackupFile(file);
        if (!result.ok)
        {
            setProblem(result.problem);
            return;
        }
        setProblem(null);
        setPending({ entries: result.entries, summary: result.summary });
    }

    const backup_caption = last_backup_day
        ? t('settings_backup_last', { date: formatDayMonth(last_backup_day, date_format) })
        : t('settings_backup_never');
    const saved_at = pending?.summary.exported_at ? Date.parse(pending.summary.exported_at) : NaN;

    return (
        <>
            <h2 className={`mono_label ${settings_styles.group_title}`}>{t('settings_group_data')}</h2>
            <div className={`${settings_styles.group} sk-frame`}>
                <SettingRow
                    label={t('settings_backup')}
                    caption={backup_caption}
                    is_caption_alert={!last_backup_day}
                    control={<TactileButton size="sm" variant="ink" onClick={() => void saveBackup()}>{t('settings_backup_button')}</TactileButton>}
                />
                <SettingRow
                    label={t('settings_restore')}
                    caption={problem ? t(PROBLEM_KEYS[problem]) : t('settings_restore_caption')}
                    is_caption_alert={problem !== null}
                    control={<TactileButton size="sm" onClick={() => file_input.current?.click()}>{t('settings_restore_button')}</TactileButton>}
                />
                <input
                    ref={file_input}
                    type="file"
                    accept="application/json,.json"
                    className={styles.file_input}
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(event) => void chooseFile(event)}
                />
            </div>

            <ModalCard is_open={pending !== null} onClose={() => setPending(null)} aria_label={t('restore_title')}>
                <div className={styles.confirm}>
                    <h2 className={styles.confirm_title}>{t('restore_title')}</h2>
                    {pending && (
                        <p className={`mono_label ${styles.confirm_summary}`}>
                            {t('restore_summary', {
                                date: Number.isNaN(saved_at) ? '?' : formatDayMonth(getDayKeyAt(saved_at), date_format),
                                sessions: pending.summary.session_count,
                                items: pending.summary.item_count,
                            })}
                        </p>
                    )}
                    <p className={styles.confirm_warning}>{t('restore_warning')}</p>
                    <div className={styles.confirm_actions}>
                        <TactileButton size="md" is_full_width onClick={() => setPending(null)}>{t('restore_cancel')}</TactileButton>
                        <TactileButton size="md" variant="accent" is_full_width onClick={() => pending && restoreBackup(pending.entries)}>{t('restore_confirm')}</TactileButton>
                    </div>
                </div>
            </ModalCard>
        </>
    );
}
