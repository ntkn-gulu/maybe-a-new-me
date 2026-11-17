import { describe, expect, it } from 'vitest';
import { DEFAULT_DATE_FORMAT, formatDayMonth } from '../src/i18n/date_format';

describe('formatDayMonth', () =>
{
    it('writes day first or month first, zero-padded', () =>
    {
        expect(formatDayMonth('2026-11-07', 'day_first')).toBe('07/11');
        expect(formatDayMonth('2026-11-07', 'month_first')).toBe('11/07');
    });

    it('defaults to day first', () =>
    {
        expect(DEFAULT_DATE_FORMAT).toBe('day_first');
    });
});
