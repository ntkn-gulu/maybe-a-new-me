import { EMPTY_PITY, exchangeShards, getChestsForKeptDay, openChest, type ChestOpenResult, type ExchangeResult } from './gacha_engine';
import { REWARD_CATALOG, getDefaultItemIds, getItem, getMilestoneFlameId } from './reward_catalog';
import { MAX_CHESTS_PER_BATCH, RARITIES, WELCOME_CHESTS } from './reward_config';
import { getTierForStreak } from './flame_tiers';
import { compareDayKeys } from './day_key';
import type { ChestType, DayKey, ItemSlot, PityState, RandomFn, Rarity } from './types';

// The player's things: items won, Flame Shards, pity counters, chests
// waiting to be opened and what is equipped in each slot. Pure functions
// that return a new inventory (the store saves it); randomness is passed in.

export interface Inventory
{
    owned_item_ids: string[];             // items won (default items are always owned and not listed)
    shards: number;
    pity: PityState;
    pending_chests: ChestType[];          // oldest first
    rewarded_day_key: DayKey | null;      // last kept day that already gave its chests
    equipped: Record<ItemSlot, string>;
}

// A fresh install: default items equipped and a few welcome chests to open
export function createInventory(): Inventory
{
    const equipped = {} as Record<ItemSlot, string>;
    for (const item of REWARD_CATALOG)
    {
        if (item.source === 'default')
        {
            equipped[item.slot] = item.id;
        }
    }
    return {
        owned_item_ids: [],
        shards: 0,
        pity: EMPTY_PITY,
        pending_chests: [...WELCOME_CHESTS],
        rewarded_day_key: null,
        equipped,
    };
}

export function getOwnedSet(inventory: Inventory): Set<string>
{
    return new Set([...getDefaultItemIds(), ...inventory.owned_item_ids]);
}

function addOwned(inventory: Inventory, item_id: string): string[]
{
    return inventory.owned_item_ids.includes(item_id) ? inventory.owned_item_ids : [...inventory.owned_item_ids, item_id];
}

// Chests for keeping a day, given only once per day: a daily chest, a silver
// chest every 7th day in a row, and on a new flame tier a milestone chest
// plus that tier's flame color
export function rewardKeptDay(inventory: Inventory, day_key: DayKey, prev_streak: number, new_streak: number): Inventory
{
    if (inventory.rewarded_day_key !== null && compareDayKeys(day_key, inventory.rewarded_day_key) <= 0)
    {
        return inventory;
    }
    const chests = getChestsForKeptDay(prev_streak, new_streak);
    let owned_item_ids = inventory.owned_item_ids;
    if (chests.includes('milestone'))
    {
        const flame_id = getMilestoneFlameId(getTierForStreak(new_streak).index);
        if (flame_id)
        {
            owned_item_ids = addOwned(inventory, flame_id);
        }
    }
    return {
        ...inventory,
        owned_item_ids,
        pending_chests: [...inventory.pending_chests, ...chests],
        rewarded_day_key: day_key,
    };
}

export function addChests(inventory: Inventory, chests: ChestType[]): Inventory
{
    return { ...inventory, pending_chests: [...inventory.pending_chests, ...chests] };
}

export interface ChestOpening
{
    inventory: Inventory;
    chest_type: ChestType;
    result: ChestOpenResult;
}

// Opens the oldest waiting chest: a new item joins the collection,
// a duplicate turns into shards. Null when no chest is waiting.
export function openNextChest(inventory: Inventory, random: RandomFn): ChestOpening | null
{
    const [chest_type, ...rest] = inventory.pending_chests;
    if (!chest_type)
    {
        return null;
    }
    const result = openChest(chest_type, inventory.pity, getOwnedSet(inventory), random);
    return {
        chest_type,
        result,
        inventory: {
            ...inventory,
            pending_chests: rest,
            pity: result.next_pity,
            shards: inventory.shards + result.shards_gained,
            owned_item_ids: result.is_duplicate ? inventory.owned_item_ids : addOwned(inventory, result.item_id),
        },
    };
}

// One chest out of a batch: what it was and what came out
export interface ChestPull
{
    chest_type: ChestType;
    result: ChestOpenResult;
}

export interface ChestBatch
{
    inventory: Inventory;
    pulls: ChestPull[];               // in the order they were opened
}

// How many chests "open all" opens right now
export function getBatchSize(inventory: Inventory): number
{
    return Math.min(inventory.pending_chests.length, MAX_CHESTS_PER_BATCH);
}

// Opens up to `count` waiting chests one after another, exactly as if they
// were opened one by one: pity carries over, and the second copy of an item
// won earlier in the same batch is already a duplicate. Null when none wait.
export function openChestBatch(inventory: Inventory, count: number, random: RandomFn): ChestBatch | null
{
    let current = inventory;
    const pulls: ChestPull[] = [];
    while (pulls.length < count)
    {
        const opening = openNextChest(current, random);
        if (!opening)
        {
            break;
        }
        current = opening.inventory;
        pulls.push({ chest_type: opening.chest_type, result: opening.result });
    }
    return pulls.length > 0 ? { inventory: current, pulls } : null;
}

// The highest rarity in a batch: the chest glows in this color before it opens
export function getBestRarity(pulls: ChestPull[]): Rarity
{
    const best_index = Math.max(...pulls.map((pull) => RARITIES.indexOf(pull.result.rarity)));
    return RARITIES[Math.max(0, best_index)];
}

// Reveal order: rarer items last, so the batch builds up to its best drop
export function sortPullsForReveal(pulls: ChestPull[]): ChestPull[]
{
    return [...pulls].sort((first, second) => RARITIES.indexOf(first.result.rarity) - RARITIES.indexOf(second.result.rarity));
}

// Spends shards on a missing item of the player's choice
export function buyWithShards(inventory: Inventory, item_id: string): { inventory: Inventory; result: ExchangeResult }
{
    const result = exchangeShards(item_id, inventory.shards, getOwnedSet(inventory));
    if (!result.ok)
    {
        return { inventory, result };
    }
    return {
        result,
        inventory: { ...inventory, shards: result.shards_left, owned_item_ids: addOwned(inventory, item_id) },
    };
}

// Puts an owned item in its slot; unknown or missing items change nothing.
// `is_ownership_required` = false lets any catalog item in (dev testing).
export function equipItem(inventory: Inventory, item_id: string, is_ownership_required = true): Inventory
{
    const item = getItem(item_id);
    if (!item || (is_ownership_required && !getOwnedSet(inventory).has(item_id)))
    {
        return inventory;
    }
    return { ...inventory, equipped: { ...inventory.equipped, [item.slot]: item_id } };
}
