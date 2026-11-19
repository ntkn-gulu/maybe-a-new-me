import { createBackup, getBackupFileName, readBackup, type BackupReadResult } from '../core/backup';
import { PROGRESS_STORAGE_KEY } from './progress_store';
import { INVENTORY_STORAGE_KEY } from './inventory_store';
import { SETTINGS_STORAGE_KEY } from './settings_store';
import { AMBIENT_STORAGE_KEY } from './ambient_store';
import { detectDevice, getTodayKey } from './clock';

// Browser side of the backup file (core/backup.ts builds and checks it).
// Saving: on a phone the file goes to the share sheet ("Save to Files",
// Drive, a chat with yourself...); on a computer it downloads.
// Restoring writes the saved stores back and reloads the app, so every
// store starts again from the restored data.
// The running focus session (mnm-focus) is never part of a backup: it only
// matters for the next minutes and must not come back on another day.

const BACKUP_KEYS = [PROGRESS_STORAGE_KEY, INVENTORY_STORAGE_KEY, SETTINGS_STORAGE_KEY, AMBIENT_STORAGE_KEY];
const REQUIRED_KEYS = [PROGRESS_STORAGE_KEY, INVENTORY_STORAGE_KEY];
const COUNTS_FROM = { session_key: PROGRESS_STORAGE_KEY, item_key: INVENTORY_STORAGE_KEY };
const URL_REVOKE_DELAY_MS = 1000;

export type BackupSaveOutcome = 'saved' | 'cancelled';

function buildBackupFile(): File
{
    const saved: Record<string, string> = {};
    for (const key of BACKUP_KEYS)
    {
        const text = localStorage.getItem(key);
        if (text !== null)
        {
            saved[key] = text;
        }
    }
    const text = JSON.stringify(createBackup(saved, new Date().toISOString()), null, 2);
    return new File([text], getBackupFileName(getTodayKey()), { type: 'application/json' });
}

function downloadFile(file: File): void
{
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), URL_REVOKE_DELAY_MS);
}

// "cancelled" when the share sheet was closed without saving
export async function saveBackupFile(): Promise<BackupSaveOutcome>
{
    const file = buildBackupFile();
    if (detectDevice() === 'phone' && navigator.canShare?.({ files: [file] }))
    {
        try
        {
            await navigator.share({ files: [file] });
            return 'saved';
        }
        catch (error)
        {
            if (error instanceof DOMException && error.name === 'AbortError')
            {
                return 'cancelled';
            }
            // Sharing failed for another reason: fall back to a download
        }
    }
    downloadFile(file);
    return 'saved';
}

export async function readBackupFile(file: File): Promise<BackupReadResult>
{
    return readBackup(await file.text(), REQUIRED_KEYS, COUNTS_FROM);
}

// Replaces the saved stores with the backup's and starts the app again.
// Only the app's own keys are written, whatever else the file holds.
export function restoreBackup(entries: Record<string, string>): void
{
    for (const key of BACKUP_KEYS)
    {
        if (entries[key] !== undefined)
        {
            localStorage.setItem(key, entries[key]);
        }
    }
    window.location.reload();
}
