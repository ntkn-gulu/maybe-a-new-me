// Flame tiers: the streak journey. Pure data + lookups, no UI code here.
// To add a tier, append an entry with a higher min_days.

export interface FlameTier
{
    index: number;
    min_days: number;   // streak length that unlocks this tier
    name: string;       // shown in the display font, uppercase
    words: string;      // short words of support, typed out on the journey screen
}

export const FLAME_TIERS: readonly FlameTier[] = [
    { index: 0, min_days: 0, name: 'Tinh Hỏa', words: 'Một đốm lửa nhỏ.\nĐủ để bắt đầu.' },
    { index: 1, min_days: 3, name: 'Xích Hỏa', words: 'Ba ngày liền.\nLửa đã bén củi.' },
    { index: 2, min_days: 7, name: 'Kim Hỏa', words: 'Trọn một tuần.\nTia lửa bắt đầu bắn ra.' },
    { index: 3, min_days: 14, name: 'Lam Hỏa', words: 'Hai tuần.\nLửa nóng tới mức đổi màu.' },
    { index: 4, min_days: 30, name: 'Tử Hỏa', words: 'Một tháng.\nThói quen đang thành con người bạn.' },
    { index: 5, min_days: 60, name: 'Huyễn Hỏa', words: 'Hai tháng.\nAi đi ngang cũng thấy bạn sáng.' },
    { index: 6, min_days: 100, name: 'Bạch Hỏa', words: 'Một trăm ngày.\nChẳng còn gì dập được nữa.' },
    { index: 7, min_days: 180, name: 'Thất Sắc Hỏa', words: 'Nửa năm.\nMỗi ngày một màu, vẫn là bạn.' },
    { index: 8, min_days: 365, name: 'Thiên Hà Hỏa', words: 'Một năm.\nCả dải ngân hà cháy trong tay bạn.' },
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
