import { describe, expect, it } from 'vitest';
import { BACKUP_APP_ID, BACKUP_FORMAT_VERSION, createBackup, getBackupFileName, readBackup } from '../src/core/backup';

const REQUIRED = ['mnm-progress', 'mnm-inventory'];
const COUNTS_FROM = { session_key: 'mnm-progress', item_key: 'mnm-inventory' };

const SAVED = {
    'mnm-progress': JSON.stringify({ state: { first_day_key: '2026-11-01', sessions: [{ status: 'completed' }, { status: 'broken' }, { status: 'completed' }] }, version: 0 }),
    'mnm-inventory': JSON.stringify({ state: { owned_item_ids: ['flame_ice', 'title_early_bird'], shards: 20 }, version: 0 }),
    'mnm-settings': JSON.stringify({ state: { language: 'vi' }, version: 3 }),
};

describe('backup', () =>
{
    it('names the file after the day', () =>
    {
        expect(getBackupFileName('2026-11-19')).toBe('new-me-backup-2026-11-19.json');
    });

    it('round-trips every saved store with a summary', () =>
    {
        const file = createBackup(SAVED, '2026-11-19T08:00:00.000Z');
        expect(file.app).toBe(BACKUP_APP_ID);
        expect(file.format_version).toBe(BACKUP_FORMAT_VERSION);

        const result = readBackup(JSON.stringify(file), REQUIRED, COUNTS_FROM);
        expect(result.ok).toBe(true);
        if (!result.ok)
        {
            return;
        }
        expect(Object.keys(result.entries).sort()).toEqual(Object.keys(SAVED).sort());
        expect(JSON.parse(result.entries['mnm-settings'])).toEqual(JSON.parse(SAVED['mnm-settings']));
        expect(result.summary).toEqual({ exported_at: '2026-11-19T08:00:00.000Z', session_count: 2, item_count: 2 });
    });

    it('leaves out a broken saved entry instead of failing', () =>
    {
        const file = createBackup({ ...SAVED, 'mnm-broken': '{not json' }, '2026-11-19T08:00:00.000Z');
        expect(Object.keys(file.stores)).not.toContain('mnm-broken');
    });

    it('rejects files that are not a usable backup', () =>
    {
        expect(readBackup('hello', REQUIRED, COUNTS_FROM)).toEqual({ ok: false, problem: 'not_json' });
        expect(readBackup(JSON.stringify({ app: 'other' }), REQUIRED, COUNTS_FROM)).toEqual({ ok: false, problem: 'not_backup' });

        const newer = { ...createBackup(SAVED, ''), format_version: BACKUP_FORMAT_VERSION + 1 };
        expect(readBackup(JSON.stringify(newer), REQUIRED, COUNTS_FROM)).toEqual({ ok: false, problem: 'newer_version' });

        const no_items = createBackup({ 'mnm-progress': SAVED['mnm-progress'] }, '');
        expect(readBackup(JSON.stringify(no_items), REQUIRED, COUNTS_FROM)).toEqual({ ok: false, problem: 'missing_data' });
    });
});
