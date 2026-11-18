import { REWARD_CATALOG, getMilestoneTierIndex, type RewardItem } from './reward_catalog';
import { SHARD_COST } from './reward_config';
import { FLAME_TIERS } from './flame_tiers';
import type { ItemSlot } from './types';

// What the Collection page shows: the items of each slot and, for every
// item, how the player can get it. Pure lookups over the catalog.

// Slot order on the Collection page
export const COLLECTION_SLOTS: readonly ItemSlot[] = ['flame', 'timer_skin', 'sound_pack', 'theme', 'title'];

// Items of one slot, in catalog order (the default item comes first)
export function getSlotItems(slot: ItemSlot): RewardItem[]
{
    return REWARD_CATALOG.filter((item) => item.slot === slot);
}

export function countOwned(items: readonly RewardItem[], owned_item_ids: ReadonlySet<string>): number
{
    return items.filter((item) => owned_item_ids.has(item.id)).length;
}

// How an item can be had:
// - owned:      already in the collection
// - for_sale:   missing, can be bought with shards (`cost`, `shards_missing` > 0 when short)
// - chest_only: missing, only drops from chests (common items are not sold)
// - milestone:  missing, granted on reaching a flame tier (`unlock_days`)
export type ItemOffer =
    | { status: 'owned' }
    | { status: 'for_sale'; cost: number; shards_missing: number }
    | { status: 'chest_only' }
    | { status: 'milestone'; unlock_days: number };

export function getItemOffer(item: RewardItem, owned_item_ids: ReadonlySet<string>, shards: number): ItemOffer
{
    if (owned_item_ids.has(item.id))
    {
        return { status: 'owned' };
    }
    if (item.source === 'milestone')
    {
        const tier = FLAME_TIERS[getMilestoneTierIndex(item.id) ?? 0];
        return { status: 'milestone', unlock_days: tier.min_days };
    }
    const cost = SHARD_COST[item.rarity];
    if (item.source !== 'gacha' || cost === null)
    {
        return { status: 'chest_only' };
    }
    return { status: 'for_sale', cost, shards_missing: Math.max(0, cost - shards) };
}
