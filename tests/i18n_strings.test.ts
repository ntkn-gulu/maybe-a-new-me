import { describe, expect, it } from 'vitest';
import { STRINGS, tierNameKey, tierWordsKey, translate } from '../src/i18n/strings';
import { FLAME_TIERS } from '../src/core/flame_tiers';

describe('i18n strings', () =>
{
    it('English has exactly the same keys as Vietnamese', () =>
    {
        expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.vi).sort());
    });

    it('every flame tier has a name and words in both languages', () =>
    {
        for (const tier of FLAME_TIERS)
        {
            for (const language of ['vi', 'en'] as const)
            {
                expect(STRINGS[language][tierNameKey(tier.index)]).toBeTruthy();
                expect(STRINGS[language][tierWordsKey(tier.index)]).toBeTruthy();
            }
        }
    });

    it('fills placeholders', () =>
    {
        expect(translate('vi', 'focus_kicker', { n: 1, goal: 4 })).toBe('Phiên 1 / 4 hôm nay');
        expect(translate('en', 'journey_streak', { n: 7 })).toBe('7 day streak');
    });
});
