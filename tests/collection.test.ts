import { describe, expect, it } from 'vitest';
import { COLLECTION_SLOTS, countOwned, getItemOffer, getSlotItems } from '../src/core/collection';
import { REWARD_CATALOG, getItem, getMilestoneTierIndex } from '../src/core/reward_catalog';
import { SHARD_COST } from '../src/core/reward_config';

function item(item_id: string)
{
    const found = getItem(item_id);
    if (!found)
    {
        throw new Error(`missing item ${item_id}`);
    }
    return found;
}

describe('collection', () =>
{
    it('lists every catalog item under exactly one slot, default first', () =>
    {
        const listed = COLLECTION_SLOTS.flatMap((slot) => getSlotItems(slot));
        expect(listed).toHaveLength(REWARD_CATALOG.length);
        for (const slot of COLLECTION_SLOTS)
        {
            expect(getSlotItems(slot)[0].source).toBe('default');
        }
    });

    it('counts owned items of a slot', () =>
    {
        const owned = new Set(['flame_follow_tier', 'flame_ice', 'timer_neon']);
        expect(countOwned(getSlotItems('flame'), owned)).toBe(2);
    });

    it('describes how a missing item can be had', () =>
    {
        const owned = new Set<string>(['flame_follow_tier']);
        expect(getItemOffer(item('flame_follow_tier'), owned, 0)).toEqual({ status: 'owned' });
        expect(getItemOffer(item('title_night_owl'), owned, 999)).toEqual({ status: 'chest_only' });
        expect(getItemOffer(item('flame_tier_4'), owned, 999)).toEqual({ status: 'milestone', unlock_days: 30 });
        expect(getItemOffer(item('timer_neon'), owned, 100)).toEqual({ status: 'for_sale', cost: SHARD_COST.epic, shards_missing: 50 });
        expect(getItemOffer(item('theme_sketch'), owned, 500)).toEqual({ status: 'for_sale', cost: SHARD_COST.legendary, shards_missing: 0 });
    });

    it('finds the tier of a milestone flame only', () =>
    {
        expect(getMilestoneTierIndex('flame_tier_8')).toBe(8);
        expect(getMilestoneTierIndex('flame_tier_9')).toBeNull();
        expect(getMilestoneTierIndex('flame_ice')).toBeNull();
    });
});
