import type { RewardItem } from '../../core/reward_catalog';
import { isThemeItemReady } from '../../stores/active_theme';

// Items that change the app when equipped: every flame color, timer skin,
// sound pack and title, and the theme items that are finished.
export function canEquipNow(item: RewardItem): boolean
{
    return item.slot !== 'theme' || isThemeItemReady(item.id);
}
