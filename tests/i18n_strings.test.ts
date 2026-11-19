import { describe, expect, it } from 'vitest';
import { STRINGS, ambientLayerKey, ambientPresetKey, monthNameKey, sportActivityKey, tierNameKey, tierWordsKey, translate, weekdayKey } from '../src/i18n/strings';
import { SPORT_ACTIVITIES } from '../src/core/sport_rules';
import { FLAME_TIERS } from '../src/core/flame_tiers';
import { AMBIENT_LAYERS, AMBIENT_PRESETS } from '../src/core/ambient_mix';

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

    it('every ambient layer and preset has a name', () =>
    {
        for (const language of ['vi', 'en'] as const)
        {
            AMBIENT_LAYERS.forEach((layer) => expect(STRINGS[language][ambientLayerKey(layer)]).toBeTruthy());
            AMBIENT_PRESETS.forEach((preset) => expect(STRINGS[language][ambientPresetKey(preset.id)]).toBeTruthy());
        }
    });

    it('fills placeholders', () =>
    {
        expect(translate('vi', 'focus_kicker', { n: 1, goal: 4 })).toBe('Phiên 1 / 4 hôm nay');
        expect(translate('en', 'journey_streak', { n: 7 })).toBe('7 day streak');
    });
});

describe('calendar and sport keys', () =>
{
    it('has every month, weekday and sport activity in both languages', () =>
    {
        const keys = [
            ...Array.from({ length: 12 }, (_, index) => monthNameKey(index + 1)),
            ...Array.from({ length: 7 }, (_, weekday) => weekdayKey(weekday)),
            ...SPORT_ACTIVITIES.map(sportActivityKey),
        ];
        for (const key of keys)
        {
            expect(STRINGS.vi[key], key).toBeTruthy();
            expect(STRINGS.en[key], key).toBeTruthy();
        }
    });
});
