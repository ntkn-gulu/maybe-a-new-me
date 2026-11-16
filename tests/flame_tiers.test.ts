import { describe, expect, it } from 'vitest';
import { FLAME_TIERS, getNextTier, getTierForStreak, getTierProgress } from '../src/core/flame_tiers';

describe('FLAME_TIERS', () =>
{
    it('matches the planned milestones', () =>
    {
        expect(FLAME_TIERS.map((tier) => tier.min_days)).toEqual([0, 3, 7, 14, 30, 60, 100, 180, 365]);
    });

    it('has index equal to position', () =>
    {
        FLAME_TIERS.forEach((tier, position) => expect(tier.index).toBe(position));
    });
});

describe('getTierForStreak', () =>
{
    it.each([
        [0, 0], [2, 0], [3, 1], [6, 1], [7, 2], [13, 2], [14, 3],
        [29, 3], [30, 4], [59, 4], [60, 5], [99, 5], [100, 6],
        [179, 6], [180, 7], [364, 7], [365, 8], [1000, 8],
    ])('streak %i -> tier %i', (streak_days, expected_index) =>
    {
        expect(getTierForStreak(streak_days).index).toBe(expected_index);
    });
});

describe('getNextTier', () =>
{
    it('returns null at the last tier', () =>
    {
        expect(getNextTier(FLAME_TIERS[FLAME_TIERS.length - 1])).toBeNull();
    });
});

describe('getTierProgress', () =>
{
    it('counts days inside the current tier', () =>
    {
        const progress = getTierProgress(45);
        expect(progress.current.index).toBe(4);
        expect(progress.days_into_tier).toBe(15);
        expect(progress.days_to_next).toBe(30);
        expect(progress.ratio).toBeCloseTo(0.5);
    });

    it('is full at the last tier', () =>
    {
        const progress = getTierProgress(400);
        expect(progress.next).toBeNull();
        expect(progress.ratio).toBe(1);
    });
});
