import type { ItemSlot, Rarity } from './types';

// Every unlockable item. Display names live in i18n as `item_<id>`.
// source "gacha": can drop from chests (and be bought with shards)
// source "milestone": granted when reaching a flame tier
// source "default": owned from the start

export interface RewardItem
{
    id: string;
    slot: ItemSlot;
    rarity: Rarity;
    source: 'gacha' | 'milestone' | 'default';
}

export const REWARD_CATALOG: readonly RewardItem[] = [
    // Defaults (equipped on a fresh install)
    { id: 'flame_follow_tier', slot: 'flame', rarity: 'common', source: 'default' },
    { id: 'timer_classic', slot: 'timer_skin', rarity: 'common', source: 'default' },
    { id: 'sound_classic', slot: 'sound_pack', rarity: 'common', source: 'default' },
    { id: 'theme_classic', slot: 'theme', rarity: 'common', source: 'default' },
    { id: 'title_beginner', slot: 'title', rarity: 'common', source: 'default' },

    // Titles (common)
    { id: 'title_night_owl', slot: 'title', rarity: 'common', source: 'gacha' },
    { id: 'title_early_bird', slot: 'title', rarity: 'common', source: 'gacha' },
    { id: 'title_cafe_warrior', slot: 'title', rarity: 'common', source: 'gacha' },
    { id: 'title_deadline_slayer', slot: 'title', rarity: 'common', source: 'gacha' },
    { id: 'title_focus_monk', slot: 'title', rarity: 'common', source: 'gacha' },
    { id: 'title_exam_survivor', slot: 'title', rarity: 'common', source: 'gacha' },

    // Themes (rare)
    { id: 'theme_midnight', slot: 'theme', rarity: 'rare', source: 'gacha' },
    { id: 'theme_matcha', slot: 'theme', rarity: 'rare', source: 'gacha' },
    { id: 'theme_sunset', slot: 'theme', rarity: 'rare', source: 'gacha' },
    { id: 'theme_ocean', slot: 'theme', rarity: 'rare', source: 'gacha' },

    // Sound packs (rare / epic)
    { id: 'sound_mechanical', slot: 'sound_pack', rarity: 'rare', source: 'gacha' },
    { id: 'sound_wood', slot: 'sound_pack', rarity: 'rare', source: 'gacha' },
    { id: 'sound_retro', slot: 'sound_pack', rarity: 'epic', source: 'gacha' },
    { id: 'sound_wind_chime', slot: 'sound_pack', rarity: 'epic', source: 'gacha' },

    // Timer skins (epic)
    { id: 'timer_retro_lcd', slot: 'timer_skin', rarity: 'epic', source: 'gacha' },
    { id: 'timer_nixie', slot: 'timer_skin', rarity: 'epic', source: 'gacha' },
    { id: 'timer_neon', slot: 'timer_skin', rarity: 'epic', source: 'gacha' },
    { id: 'timer_hourglass', slot: 'timer_skin', rarity: 'epic', source: 'gacha' },

    // Rare flame colors (epic / legendary)
    { id: 'flame_ice', slot: 'flame', rarity: 'epic', source: 'gacha' },
    { id: 'flame_toxic', slot: 'flame', rarity: 'epic', source: 'gacha' },
    { id: 'flame_shadow', slot: 'flame', rarity: 'legendary', source: 'gacha' },
    { id: 'flame_gold_24k', slot: 'flame', rarity: 'legendary', source: 'gacha' },
    { id: 'flame_aurora', slot: 'flame', rarity: 'legendary', source: 'gacha' },

    // Legendary themes: a whole new way of drawing the app (see theme_checklist.md)
    { id: 'theme_sketch', slot: 'theme', rarity: 'legendary', source: 'gacha' },

    // Tier flame colors, granted by reaching each tier (index 1..8)
    { id: 'flame_tier_1', slot: 'flame', rarity: 'rare', source: 'milestone' },
    { id: 'flame_tier_2', slot: 'flame', rarity: 'rare', source: 'milestone' },
    { id: 'flame_tier_3', slot: 'flame', rarity: 'rare', source: 'milestone' },
    { id: 'flame_tier_4', slot: 'flame', rarity: 'epic', source: 'milestone' },
    { id: 'flame_tier_5', slot: 'flame', rarity: 'epic', source: 'milestone' },
    { id: 'flame_tier_6', slot: 'flame', rarity: 'epic', source: 'milestone' },
    { id: 'flame_tier_7', slot: 'flame', rarity: 'legendary', source: 'milestone' },
    { id: 'flame_tier_8', slot: 'flame', rarity: 'legendary', source: 'milestone' },
];

const CATALOG_BY_ID = new Map(REWARD_CATALOG.map((item) => [item.id, item]));

export function getItem(item_id: string): RewardItem | undefined
{
    return CATALOG_BY_ID.get(item_id);
}

export function getDefaultItemIds(): string[]
{
    return REWARD_CATALOG.filter((item) => item.source === 'default').map((item) => item.id);
}

// Items that can drop from chests for a given rarity
export function getGachaPool(rarity: Rarity): RewardItem[]
{
    return REWARD_CATALOG.filter((item) => item.source === 'gacha' && item.rarity === rarity);
}

const MILESTONE_FLAME_PREFIX = 'flame_tier_';

export function getMilestoneFlameId(tier_index: number): string | null
{
    const id = `${MILESTONE_FLAME_PREFIX}${tier_index}`;
    return CATALOG_BY_ID.has(id) ? id : null;
}

// The flame tier whose milestone grants this item (null for other items)
export function getMilestoneTierIndex(item_id: string): number | null
{
    if (!item_id.startsWith(MILESTONE_FLAME_PREFIX) || !CATALOG_BY_ID.has(item_id))
    {
        return null;
    }
    return Number(item_id.slice(MILESTONE_FLAME_PREFIX.length));
}
