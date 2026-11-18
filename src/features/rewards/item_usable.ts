import type { RewardItem } from '../../core/reward_catalog';
import { isThemeItemReady } from '../../stores/active_theme';

// Items that already change the app when equipped. The rest can be won and
// collected now and start working when their slot is built (timer skins,
// sound packs, color themes, titles).
export function canEquipNow(item: RewardItem): boolean
{
    return item.slot === 'flame' || (item.slot === 'theme' && isThemeItemReady(item.id));
}
