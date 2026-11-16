import {
    CHEST_RATES,
    PITY_EPIC_AT,
    PITY_LEGENDARY_AT,
    PITY_LEGENDARY_SOFT_FROM,
    PITY_LEGENDARY_SOFT_STEP,
    RARITIES,
    SHARD_COST,
    SHARDS_FOR_DUPLICATE,
    SILVER_CHEST_EVERY_DAYS,
} from './reward_config';
import { getGachaPool, getItem } from './reward_catalog';
import { getTierForStreak } from './flame_tiers';
import type { ChestType, PityState, RandomFn, Rarity } from './types';

// Chest opening with pity, plus shard exchange and chest earning.
// All pure: inputs in, result out, randomness passed as a function.

export const EMPTY_PITY: PityState = { since_epic: 0, since_legendary: 0 };

// Drop rates for this exact chest, after soft pity moves odds toward legendary
export function getEffectiveRates(chest_type: ChestType, pity: PityState): Record<Rarity, number>
{
    const rates = { ...CHEST_RATES[chest_type] };
    const chest_number = pity.since_legendary + 1;      // this chest's count since the last legendary

    if (chest_number >= PITY_LEGENDARY_AT)
    {
        return { common: 0, rare: 0, epic: 0, legendary: 1 };
    }

    if (chest_number >= PITY_LEGENDARY_SOFT_FROM)
    {
        let bonus = (chest_number - PITY_LEGENDARY_SOFT_FROM + 1) * PITY_LEGENDARY_SOFT_STEP;
        rates.legendary += bonus;
        // Take the bonus from the lowest rarities first
        for (const rarity of ['common', 'rare', 'epic'] as const)
        {
            const taken = Math.min(rates[rarity], bonus);
            rates[rarity] -= taken;
            bonus -= taken;
        }
    }
    return rates;
}

function pickWeighted(rates: Record<Rarity, number>, random: RandomFn): Rarity
{
    const total = RARITIES.reduce((sum, rarity) => sum + rates[rarity], 0);
    let roll = random() * total;
    for (const rarity of RARITIES)
    {
        roll -= rates[rarity];
        if (roll < 0)
        {
            return rarity;
        }
    }
    // Floating point safety: fall back to the best rarity that has weight
    return [...RARITIES].reverse().find((rarity) => rates[rarity] > 0) ?? 'common';
}

export function rollRarity(chest_type: ChestType, pity: PityState, random: RandomFn): Rarity
{
    const rates = getEffectiveRates(chest_type, pity);
    const rarity = pickWeighted(rates, random);

    // Hard epic pity: upgrade a low roll, keeping the epic : legendary ratio
    const is_low = rarity === 'common' || rarity === 'rare';
    if (is_low && pity.since_epic + 1 >= PITY_EPIC_AT)
    {
        return pickWeighted({ common: 0, rare: 0, epic: rates.epic, legendary: rates.legendary }, random);
    }
    return rarity;
}

export function nextPity(pity: PityState, rarity: Rarity): PityState
{
    if (rarity === 'legendary')
    {
        return { since_epic: 0, since_legendary: 0 };
    }
    if (rarity === 'epic')
    {
        return { since_epic: 0, since_legendary: pity.since_legendary + 1 };
    }
    return { since_epic: pity.since_epic + 1, since_legendary: pity.since_legendary + 1 };
}

export interface ChestOpenResult
{
    rarity: Rarity;
    item_id: string;
    is_duplicate: boolean;
    shards_gained: number;
    next_pity: PityState;
}

export function openChest(chest_type: ChestType, pity: PityState, owned_item_ids: ReadonlySet<string>, random: RandomFn): ChestOpenResult
{
    const rarity = rollRarity(chest_type, pity, random);
    const pool = getGachaPool(rarity);
    const item = pool[Math.floor(random() * pool.length)];
    const is_duplicate = owned_item_ids.has(item.id);

    return {
        rarity,
        item_id: item.id,
        is_duplicate,
        shards_gained: is_duplicate ? SHARDS_FOR_DUPLICATE[rarity] : 0,
        next_pity: nextPity(pity, rarity),
    };
}

export type ExchangeResult =
    | { ok: true; shards_left: number }
    | { ok: false; reason: 'unknown_item' | 'not_for_sale' | 'already_owned' | 'not_enough_shards' };

// Spend shards on a missing gacha item of the player's choice
export function exchangeShards(item_id: string, shards: number, owned_item_ids: ReadonlySet<string>): ExchangeResult
{
    const item = getItem(item_id);
    if (!item)
    {
        return { ok: false, reason: 'unknown_item' };
    }
    const cost = SHARD_COST[item.rarity];
    if (item.source !== 'gacha' || cost === null)
    {
        return { ok: false, reason: 'not_for_sale' };
    }
    if (owned_item_ids.has(item_id))
    {
        return { ok: false, reason: 'already_owned' };
    }
    if (shards < cost)
    {
        return { ok: false, reason: 'not_enough_shards' };
    }
    return { ok: true, shards_left: shards - cost };
}

// Chests earned when a day is kept and the streak goes from prev to new.
// Always a daily chest; a silver chest every 7th day in a row;
// a milestone chest when the flame reaches a new tier.
export function getChestsForKeptDay(prev_streak: number, new_streak: number): ChestType[]
{
    const chests: ChestType[] = ['daily'];
    if (new_streak > 0 && new_streak % SILVER_CHEST_EVERY_DAYS === 0)
    {
        chests.push('silver');
    }
    if (getTierForStreak(new_streak).index > getTierForStreak(prev_streak).index)
    {
        chests.push('milestone');
    }
    return chests;
}
