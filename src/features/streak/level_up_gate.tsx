import { useEffect } from 'react';
import { getLevelUp, settleCelebratedTier } from '../../core/flame_tiers';
import { useProgressStore, useStreak } from '../../stores/progress_store';
import { useFocusStore } from '../../stores/focus_store';
import { useInventoryStore } from '../../stores/inventory_store';
import { LevelUpOverlay } from './level_up_overlay';

// Watches the streak tier (derived from history) against the highest tier
// already celebrated (stored). A higher tier shows the level-up screen once,
// but only after any focus session screen is closed. A lost streak quietly
// lowers the celebrated tier so reaching a tier again is celebrated again.

export function LevelUpGate()
{
    const streak = useStreak();
    const celebrated_tier_index = useProgressStore((state) => state.celebrated_tier_index);
    const setCelebratedTier = useProgressStore((state) => state.setCelebratedTier);
    const has_session = useFocusStore((state) => state.session !== null);
    const equipped_flame_id = useInventoryStore((state) => state.equipped.flame);
    const current_index = streak.current_tier_index;

    useEffect(() =>
    {
        const settled = settleCelebratedTier(celebrated_tier_index, current_index);
        if (settled !== celebrated_tier_index)
        {
            setCelebratedTier(settled);
        }
    }, [celebrated_tier_index, current_index, setCelebratedTier]);

    const level_up = has_session ? null : getLevelUp(celebrated_tier_index, current_index);

    return <LevelUpOverlay level_up={level_up} color_id={equipped_flame_id} onClose={() => setCelebratedTier(current_index)} />;
}
