import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/rng';
import {
    EMPTY_PITY,
    exchangeShards,
    getChestsForKeptDay,
    getEffectiveRates,
    nextPity,
    openChest,
} from '../src/core/gacha_engine';
import {
    CHEST_RATES,
    PITY_EPIC_AT,
    PITY_LEGENDARY_AT,
    PITY_LEGENDARY_SOFT_FROM,
    PITY_LEGENDARY_SOFT_STEP,
    RARITIES,
    SHARD_COST,
    SHARDS_FOR_DUPLICATE,
} from '../src/core/reward_config';
import { REWARD_CATALOG, getDefaultItemIds, getGachaPool, getMilestoneFlameId } from '../src/core/reward_catalog';
import { STRINGS, itemNameKey } from '../src/i18n/strings';
import type { ChestType, PityState, Rarity } from '../src/core/types';

function sumRates(rates: Record<Rarity, number>): number
{
    return RARITIES.reduce((sum, rarity) => sum + rates[rarity], 0);
}

describe('reward config', () =>
{
    // Pins the numbers agreed in the plan. When tuning on purpose, update this test too.
    it('matches the agreed design numbers', () =>
    {
        expect(CHEST_RATES.daily).toEqual({ common: 0.60, rare: 0.28, epic: 0.10, legendary: 0.02 });
        expect(CHEST_RATES.silver).toEqual({ common: 0, rare: 0.70, epic: 0.25, legendary: 0.05 });
        expect(CHEST_RATES.milestone).toEqual({ common: 0, rare: 0, epic: 0.80, legendary: 0.20 });
        expect(PITY_EPIC_AT).toBe(10);
        expect(PITY_LEGENDARY_SOFT_FROM).toBe(35);
        expect(PITY_LEGENDARY_SOFT_STEP).toBe(0.02);
        expect(PITY_LEGENDARY_AT).toBe(50);
        expect(SHARDS_FOR_DUPLICATE).toEqual({ common: 5, rare: 15, epic: 40, legendary: 100 });
        expect(SHARD_COST).toEqual({ common: null, rare: 60, epic: 150, legendary: 400 });
    });

    it('has rates summing to 1 for every chest', () =>
    {
        for (const chest of Object.keys(CHEST_RATES) as ChestType[])
        {
            expect(sumRates(CHEST_RATES[chest])).toBeCloseTo(1);
        }
    });
});

describe('reward catalog', () =>
{
    it('has unique ids', () =>
    {
        const ids = REWARD_CATALOG.map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('has a gacha pool for every rarity a chest can roll', () =>
    {
        for (const rarity of RARITIES)
        {
            expect(getGachaPool(rarity).length).toBeGreaterThan(0);
        }
    });

    it('names every item in both languages', () =>
    {
        for (const item of REWARD_CATALOG)
        {
            expect(STRINGS.vi[itemNameKey(item.id)], item.id).toBeTruthy();
            expect(STRINGS.en[itemNameKey(item.id)], item.id).toBeTruthy();
        }
    });

    it('has one default item per slot and a flame for each tier 1..8', () =>
    {
        expect(getDefaultItemIds()).toHaveLength(5);
        for (let tier = 1; tier <= 8; tier++)
        {
            expect(getMilestoneFlameId(tier)).toBe(`flame_tier_${tier}`);
        }
        expect(getMilestoneFlameId(0)).toBeNull();
    });
});

describe('soft and hard pity', () =>
{
    it('uses base rates early on', () =>
    {
        expect(getEffectiveRates('daily', EMPTY_PITY)).toEqual(CHEST_RATES.daily);
    });

    it('raises legendary odds from chest 35, keeping the total at 1', () =>
    {
        const rates = getEffectiveRates('daily', { since_epic: 0, since_legendary: 39 });   // chest #40
        expect(rates.legendary).toBeCloseTo(0.02 + 6 * 0.02);
        expect(sumRates(rates)).toBeCloseTo(1);
    });

    it('guarantees legendary on chest 50', () =>
    {
        const pity: PityState = { since_epic: 0, since_legendary: PITY_LEGENDARY_AT - 1 };
        const result = openChest('daily', pity, new Set(), createSeededRandom(3));
        expect(result.rarity).toBe('legendary');
    });

    it('guarantees at least epic on chest 10', () =>
    {
        for (let seed = 1; seed <= 300; seed++)
        {
            const pity: PityState = { since_epic: PITY_EPIC_AT - 1, since_legendary: PITY_EPIC_AT - 1 };
            const { rarity } = openChest('daily', pity, new Set(), createSeededRandom(seed));
            expect(['epic', 'legendary']).toContain(rarity);
        }
    });

    it('resets counters correctly', () =>
    {
        expect(nextPity({ since_epic: 4, since_legendary: 20 }, 'common')).toEqual({ since_epic: 5, since_legendary: 21 });
        expect(nextPity({ since_epic: 4, since_legendary: 20 }, 'epic')).toEqual({ since_epic: 0, since_legendary: 21 });
        expect(nextPity({ since_epic: 4, since_legendary: 20 }, 'legendary')).toEqual({ since_epic: 0, since_legendary: 0 });
    });
});

describe('10,000 daily chests (simulation)', () =>
{
    const random = createSeededRandom(2026);
    const counts: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let pity = EMPTY_PITY;
    let longest_without_epic = 0;
    let longest_without_legendary = 0;

    for (let chest = 0; chest < 10_000; chest++)
    {
        const result = openChest('daily', pity, new Set(), random);
        counts[result.rarity] += 1;
        pity = result.next_pity;
        longest_without_epic = Math.max(longest_without_epic, pity.since_epic);
        longest_without_legendary = Math.max(longest_without_legendary, pity.since_legendary);
    }

    it('lands near the configured rates (pity adds a little on top)', () =>
    {
        expect(counts.common / 10_000).toBeGreaterThan(0.45);
        expect(counts.common / 10_000).toBeLessThan(0.62);
        expect(counts.rare / 10_000).toBeGreaterThan(0.22);
        expect(counts.legendary / 10_000).toBeGreaterThan(0.02);
        expect(counts.legendary / 10_000).toBeLessThan(0.05);
    });

    it('never goes 10 chests without an epic or 50 without a legendary', () =>
    {
        expect(longest_without_epic).toBeLessThan(PITY_EPIC_AT);
        expect(longest_without_legendary).toBeLessThan(PITY_LEGENDARY_AT);
    });
});

describe('duplicates and shards', () =>
{
    it('turns an owned drop into shards', () =>
    {
        const every_gacha_item = new Set(REWARD_CATALOG.map((item) => item.id));
        const result = openChest('daily', EMPTY_PITY, every_gacha_item, createSeededRandom(5));
        expect(result.is_duplicate).toBe(true);
        expect(result.shards_gained).toBeGreaterThan(0);
    });

    it('gives a new item no shards', () =>
    {
        const result = openChest('daily', EMPTY_PITY, new Set(), createSeededRandom(5));
        expect(result.is_duplicate).toBe(false);
        expect(result.shards_gained).toBe(0);
    });

    it('sells missing gacha items for shards', () =>
    {
        expect(exchangeShards('flame_shadow', 400, new Set())).toEqual({ ok: true, shards_left: 0 });
        expect(exchangeShards('flame_shadow', 399, new Set())).toEqual({ ok: false, reason: 'not_enough_shards' });
        expect(exchangeShards('flame_shadow', 999, new Set(['flame_shadow']))).toEqual({ ok: false, reason: 'already_owned' });
        expect(exchangeShards('title_night_owl', 999, new Set())).toEqual({ ok: false, reason: 'not_for_sale' });
        expect(exchangeShards('flame_tier_8', 999, new Set())).toEqual({ ok: false, reason: 'not_for_sale' });
        expect(exchangeShards('nope', 999, new Set())).toEqual({ ok: false, reason: 'unknown_item' });
    });
});

describe('getChestsForKeptDay', () =>
{
    it('always gives a daily chest', () =>
    {
        expect(getChestsForKeptDay(0, 1)).toEqual(['daily']);
    });

    it('adds a milestone chest when reaching a new tier', () =>
    {
        expect(getChestsForKeptDay(2, 3)).toEqual(['daily', 'milestone']);
    });

    it('adds a silver chest every 7 days (and a milestone on day 7)', () =>
    {
        expect(getChestsForKeptDay(6, 7)).toEqual(['daily', 'silver', 'milestone']);
        expect(getChestsForKeptDay(20, 21)).toEqual(['daily', 'silver']);
    });
});
