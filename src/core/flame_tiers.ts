// Flame tiers: the streak journey. Pure data + lookups, no UI code here.
// Display names and words live in i18n (tier_<index>_name / tier_<index>_words).
// To add a tier, append an entry with a higher min_days and add its strings.

export interface FlameTier
{
    index: number;
    min_days: number;   // streak length that unlocks this tier
}

export const FLAME_TIERS: readonly FlameTier[] = [
    { index: 0, min_days: 0 },
    { index: 1, min_days: 3 },
    { index: 2, min_days: 7 },
    { index: 3, min_days: 14 },
    { index: 4, min_days: 30 },
    { index: 5, min_days: 60 },
    { index: 6, min_days: 100 },
    { index: 7, min_days: 180 },
    { index: 8, min_days: 365 },
];

export function getTierForStreak(streak_days: number): FlameTier
{
    let current = FLAME_TIERS[0];
    for (const tier of FLAME_TIERS)
    {
        if (streak_days >= tier.min_days)
        {
            current = tier;
        }
    }
    return current;
}

export function getNextTier(tier: FlameTier): FlameTier | null
{
    return FLAME_TIERS[tier.index + 1] ?? null;
}

export interface TierProgress
{
    current: FlameTier;
    next: FlameTier | null;
    days_into_tier: number;    // days since this tier was reached
    days_to_next: number;      // span of this tier (0 when at the last tier)
    ratio: number;             // 0..1 progress toward the next tier
}

export function getTierProgress(streak_days: number): TierProgress
{
    const current = getTierForStreak(streak_days);
    const next = getNextTier(current);
    const days_into_tier = streak_days - current.min_days;

    if (!next)
    {
        return { current, next, days_into_tier, days_to_next: 0, ratio: 1 };
    }

    const days_to_next = next.min_days - current.min_days;
    return { current, next, days_into_tier, days_to_next, ratio: days_into_tier / days_to_next };
}
