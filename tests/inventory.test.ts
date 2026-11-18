import { describe, expect, it } from 'vitest';
import {
    addChests,
    buyWithShards,
    createInventory,
    equipItem,
    getOwnedSet,
    openNextChest,
    rewardKeptDay,
    type Inventory,
} from '../src/core/inventory';
import { WELCOME_CHESTS, SHARD_COST } from '../src/core/reward_config';
import { getDefaultItemIds } from '../src/core/reward_catalog';
import { createSeededRandom } from '../src/core/rng';

describe('createInventory', () =>
{
    it('starts with the welcome chests, no shards and the defaults equipped', () =>
    {
        const inventory = createInventory();
        expect(inventory.pending_chests).toEqual(WELCOME_CHESTS);
        expect(inventory.shards).toBe(0);
        expect(inventory.equipped.theme).toBe('theme_classic');
        expect(inventory.equipped.flame).toBe('flame_follow_tier');
        expect(Object.keys(inventory.equipped).sort()).toEqual(['flame', 'sound_pack', 'theme', 'timer_skin', 'title']);
    });

    it('owns every default item', () =>
    {
        const owned = getOwnedSet(createInventory());
        for (const id of getDefaultItemIds())
        {
            expect(owned.has(id)).toBe(true);
        }
    });
});

describe('rewardKeptDay', () =>
{
    const empty: Inventory = { ...createInventory(), pending_chests: [] };

    it('gives a daily chest once per day', () =>
    {
        const once = rewardKeptDay(empty, '2026-11-17', 1, 2);
        expect(once.pending_chests).toEqual(['daily']);
        expect(once.rewarded_day_key).toBe('2026-11-17');
        expect(rewardKeptDay(once, '2026-11-17', 1, 2)).toBe(once);
        expect(rewardKeptDay(once, '2026-11-16', 0, 1)).toBe(once);
    });

    it('adds a silver chest on the 7th day and a milestone chest with the tier color on a new tier', () =>
    {
        const day_7 = rewardKeptDay(empty, '2026-11-17', 6, 7);
        expect(day_7.pending_chests).toEqual(['daily', 'silver', 'milestone']);
        expect(day_7.owned_item_ids).toContain('flame_tier_2');

        const day_3 = rewardKeptDay(empty, '2026-11-17', 2, 3);
        expect(day_3.pending_chests).toEqual(['daily', 'milestone']);
        expect(day_3.owned_item_ids).toEqual(['flame_tier_1']);
    });
});

describe('openNextChest', () =>
{
    it('returns null when no chest is waiting', () =>
    {
        expect(openNextChest({ ...createInventory(), pending_chests: [] }, createSeededRandom(1))).toBeNull();
    });

    it('opens the oldest chest and keeps the item or turns a duplicate into shards', () =>
    {
        let inventory = addChests({ ...createInventory(), pending_chests: [] }, Array(60).fill('daily'));
        const random = createSeededRandom(42);
        let duplicates = 0;
        let legendary = 0;
        for (let index = 0; index < 60; index++)
        {
            const opening = openNextChest(inventory, random);
            expect(opening).not.toBeNull();
            const { result } = opening!;
            const before_shards = inventory.shards;
            inventory = opening!.inventory;
            expect(getOwnedSet(inventory).has(result.item_id)).toBe(true);
            if (result.is_duplicate)
            {
                duplicates++;
                expect(inventory.shards).toBe(before_shards + result.shards_gained);
            }
            if (result.rarity === 'legendary')
            {
                legendary++;
            }
        }
        expect(inventory.pending_chests).toHaveLength(0);
        expect(duplicates).toBeGreaterThan(0);
        expect(legendary).toBeGreaterThan(0);       // pity guarantees one within 50 chests
    });
});

describe('buyWithShards', () =>
{
    it('buys a missing item and refuses when shards are short', () =>
    {
        const cost = SHARD_COST.legendary!;
        const rich = { ...createInventory(), shards: cost + 5 };
        const bought = buyWithShards(rich, 'theme_sketch');
        expect(bought.result.ok).toBe(true);
        expect(bought.inventory.shards).toBe(5);
        expect(getOwnedSet(bought.inventory).has('theme_sketch')).toBe(true);

        const poor = buyWithShards({ ...createInventory(), shards: 10 }, 'theme_sketch');
        expect(poor.result.ok).toBe(false);
        expect(poor.inventory.shards).toBe(10);
    });
});

describe('equipItem', () =>
{
    it('equips owned items only', () =>
    {
        const base = createInventory();
        expect(equipItem(base, 'theme_sketch')).toBe(base);
        const owner = { ...base, owned_item_ids: ['theme_sketch'] };
        expect(equipItem(owner, 'theme_sketch').equipped.theme).toBe('theme_sketch');
        expect(equipItem(owner, 'not_an_item')).toBe(owner);
        expect(equipItem(base, 'theme_sketch', false).equipped.theme).toBe('theme_sketch');
        expect(equipItem(base, 'not_an_item', false)).toBe(base);
    });
});
