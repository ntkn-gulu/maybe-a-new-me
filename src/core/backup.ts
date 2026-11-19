import type { DayKey } from './types';

// Backup file: everything the app saved (history, items, settings) in one
// JSON file the user keeps in Files / Drive, so changing phones or deleting
// the home screen app does not wipe the streak. Pure: the browser side reads
// and writes localStorage and the file; this only builds and checks the text.
//
// File shape: { app, format_version, exported_at, stores: { <storage key>: <saved store> } }
// where each saved store is what zustand persist wrote: { state, version }.

export const BACKUP_APP_ID = 'maybe-a-new-me';
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile
{
    app: string;
    format_version: number;
    exported_at: string;              // ISO time
    stores: Record<string, unknown>;
}

// What a backup holds, shown before restoring it
export interface BackupSummary
{
    exported_at: string;
    session_count: number;          // finished focus sessions
    item_count: number;             // items won (defaults not counted)
}

export type BackupProblem = 'not_json' | 'not_backup' | 'newer_version' | 'missing_data';

export type BackupReadResult =
    | { ok: true; entries: Record<string, string>; summary: BackupSummary }
    | { ok: false; problem: BackupProblem };

export function getBackupFileName(day_key: DayKey): string
{
    return `new-me-backup-${day_key}.json`;
}

function isRecord(value: unknown): value is Record<string, unknown>
{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// A saved zustand store: an object with a `state` object inside
function isSavedStore(value: unknown): value is { state: Record<string, unknown> }
{
    return isRecord(value) && isRecord(value.state);
}

// Length of an array field of a saved store (0 when missing), counting only
// the entries `keep` accepts
function countArray(store: unknown, field: string, keep: (entry: unknown) => boolean = () => true): number
{
    if (!isSavedStore(store))
    {
        return 0;
    }
    const value = store.state[field];
    return Array.isArray(value) ? value.filter(keep).length : 0;
}

function isCompletedSession(entry: unknown): boolean
{
    return isRecord(entry) && entry.status === 'completed';
}

// `saved` = storage key → the raw text in storage (unreadable entries are skipped)
export function createBackup(saved: Record<string, string>, exported_at: string): BackupFile
{
    const stores: Record<string, unknown> = {};
    for (const [key, text] of Object.entries(saved))
    {
        try
        {
            const value: unknown = JSON.parse(text);
            if (isSavedStore(value))
            {
                stores[key] = value;
            }
        }
        catch
        {
            // A broken entry is left out rather than breaking the whole backup
        }
    }
    return { app: BACKUP_APP_ID, format_version: BACKUP_FORMAT_VERSION, exported_at, stores };
}

// Checks a chosen file. `required_keys` must all be there (the history and
// the items), others are taken when present. `session_key` / `item_key`
// point at the stores the summary counts from.
export function readBackup(text: string, required_keys: readonly string[], counts_from: { session_key: string; item_key: string }): BackupReadResult
{
    let parsed: unknown;
    try
    {
        parsed = JSON.parse(text);
    }
    catch
    {
        return { ok: false, problem: 'not_json' };
    }
    if (!isRecord(parsed) || parsed.app !== BACKUP_APP_ID || typeof parsed.format_version !== 'number' || !isRecord(parsed.stores))
    {
        return { ok: false, problem: 'not_backup' };
    }
    if (parsed.format_version > BACKUP_FORMAT_VERSION)
    {
        return { ok: false, problem: 'newer_version' };
    }

    const stores = parsed.stores;
    if (required_keys.some((key) => !isSavedStore(stores[key])))
    {
        return { ok: false, problem: 'missing_data' };
    }

    const entries: Record<string, string> = {};
    for (const [key, value] of Object.entries(stores))
    {
        if (isSavedStore(value))
        {
            entries[key] = JSON.stringify(value);
        }
    }
    return {
        ok: true,
        entries,
        summary: {
            exported_at: typeof parsed.exported_at === 'string' ? parsed.exported_at : '',
            session_count: countArray(stores[counts_from.session_key], 'sessions', isCompletedSession),
            item_count: countArray(stores[counts_from.item_key], 'owned_item_ids'),
        },
    };
}
