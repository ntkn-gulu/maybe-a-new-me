import type { ChestType, Rarity } from './types';

// Every gacha number in one place. Tune here after real play-testing.

export const RARITIES: readonly Rarity[] = ['common', 'rare', 'epic', 'legendary'];

// Drop rates per chest type (each row sums to 1)
export const CHEST_RATES: Record<ChestType, Record<Rarity, number>> = {
    daily: { common: 0.60, rare: 0.28, epic: 0.10, legendary: 0.02 },
    silver: { common: 0, rare: 0.70, epic: 0.25, legendary: 0.05 },
    milestone: { common: 0, rare: 0, epic: 0.80, legendary: 0.20 },
};

// Chests waiting on a fresh install, so there is something to open right away
export const WELCOME_CHESTS: readonly ChestType[] = ['daily', 'daily', 'daily'];

// Every 7th kept day in a row also gives a silver chest
export const SILVER_CHEST_EVERY_DAYS = 7;

// Pity: guaranteed epic-or-better on this chest number without one
export const PITY_EPIC_AT = 10;
// Pity: legendary chance grows from this chest number...
export const PITY_LEGENDARY_SOFT_FROM = 35;
// ...by this much per chest...
export const PITY_LEGENDARY_SOFT_STEP = 0.02;
// ...and is guaranteed on this chest number
export const PITY_LEGENDARY_AT = 50;

// Shards received when a drop is a duplicate
export const SHARDS_FOR_DUPLICATE: Record<Rarity, number> = { common: 5, rare: 15, epic: 40, legendary: 100 };

// Shards needed to buy a missing item of a rarity (common items are not sold)
export const SHARD_COST: Record<Rarity, number | null> = { common: null, rare: 60, epic: 150, legendary: 400 };
