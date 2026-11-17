import { useEffect } from 'react';
import { useStreak, useTodayProgress } from '../../stores/progress_store';
import { useInventoryStore } from '../../stores/inventory_store';

// Gives the chests for keeping today, once: as soon as today counts as kept
// (goal met, or a checked-in sport day) the inventory gets a daily chest,
// plus a silver one every 7th day in a row and a milestone chest (with the
// new tier's flame color) on a new flame tier. The inventory remembers the
// rewarded day, so reopening the app never pays twice. Renders nothing.

export function RewardGate()
{
    const today = useTodayProgress();
    const current_streak = useStreak().current_streak;
    const rewardKeptDay = useInventoryStore((state) => state.rewardKeptDay);

    useEffect(() =>
    {
        if (today.is_kept && current_streak > 0)
        {
            // Today is part of the streak, so before today it was one shorter
            rewardKeptDay(today.today, current_streak - 1, current_streak);
        }
    }, [today.is_kept, today.today, current_streak, rewardKeptDay]);

    return null;
}
