// How each flame looks. Two separate parts:
// - colors: from the tier by default, or from an equipped flame color item
// - effects: always from the tier (more shards, rising embers, stars...)
// so an equipped color changes the paint but never hides the tier you earned.

export interface FlameColors
{
    shades: [string, string, string, string];      // facet tones, darkest (shadow side) to lightest (lit face)
    core: [string, string];                        // inner hot core, dark then light
    glow: string;                                  // halo behind the flame
    shard_colors: string[];                        // floating shards and embers
    is_hue_cycling: boolean;                       // hue keeps rotating (rainbow)
}

export interface FlameEffects
{
    shard_count: number;                           // floating triangles around the flame (max 8)
    ember_count: number;                           // sparks rising from the flame
    glow_pulse: number;                            // how much the halo breathes (scale amplitude)
    has_stars: boolean;                            // twinkling stars inside the flame
}

// Index matches FLAME_TIERS in core
export const TIER_COLORS: readonly FlameColors[] = [
    // 0 Tinh Hỏa: dim ember
    {
        shades: ['#6b5246', '#8c6a58', '#b48a6e', '#dcb08e'],
        core: ['#eab48a', '#fff1e0'],
        glow: 'rgba(214, 150, 110, 0.35)',
        shard_colors: ['#b48a6e', '#d9cfbf', '#8c6a58'],
        is_hue_cycling: false,
    },
    // 1 Xích Hỏa: classic orange-red
    {
        shades: ['#c2300c', '#e8501a', '#ff7426', '#ffa04f'],
        core: ['#ffc94d', '#fff6d6'],
        glow: 'rgba(255, 90, 31, 0.38)',
        shard_colors: ['#ff5a1f', '#ffc21a', '#ff4d6d'],
        is_hue_cycling: false,
    },
    // 2 Kim Hỏa: gold
    {
        shades: ['#b86e00', '#e39600', '#ffbd14', '#ffde61'],
        core: ['#fff3b0', '#ffffff'],
        glow: 'rgba(255, 194, 26, 0.42)',
        shard_colors: ['#ffc21a', '#ffde61', '#ff7426'],
        is_hue_cycling: false,
    },
    // 3 Lam Hỏa: hot blue
    {
        shades: ['#1531b8', '#2d4bff', '#4f7dff', '#8fb2ff'],
        core: ['#a8f0ff', '#ffffff'],
        glow: 'rgba(45, 75, 255, 0.35)',
        shard_colors: ['#2d4bff', '#3ccfe0', '#8fb2ff'],
        is_hue_cycling: false,
    },
    // 4 Tử Hỏa: purple
    {
        shades: ['#4b1fa8', '#6f3de0', '#9466ff', '#c3a8ff'],
        core: ['#ffd1f5', '#ffffff'],
        glow: 'rgba(148, 102, 255, 0.38)',
        shard_colors: ['#9466ff', '#b69cff', '#ff4d6d'],
        is_hue_cycling: false,
    },
    // 5 Huyễn Hỏa: neon pink
    {
        shades: ['#b0105a', '#e61e78', '#ff4d9a', '#ff9cc8'],
        core: ['#ffe36e', '#ffffff'],
        glow: 'rgba(255, 77, 154, 0.45)',
        shard_colors: ['#ff4d9a', '#3ccfe0', '#ffe36e'],
        is_hue_cycling: false,
    },
    // 6 Bạch Hỏa: platinum white
    {
        shades: ['#8d98ab', '#b9c3d5', '#dfe6f2', '#ffffff'],
        core: ['#cfe9ff', '#ffffff'],
        glow: 'rgba(160, 190, 230, 0.5)',
        shard_colors: ['#dfe6f2', '#b9c3d5', '#cfe9ff'],
        is_hue_cycling: false,
    },
    // 7 Thất Sắc Hỏa: rainbow (hue keeps rotating)
    {
        shades: ['#c2300c', '#e8501a', '#ff7426', '#ffa04f'],
        core: ['#ffe36e', '#ffffff'],
        glow: 'rgba(255, 120, 200, 0.4)',
        shard_colors: ['#ff4d6d', '#ffc21a', '#3ccfe0', '#2d4bff', '#9466ff'],
        is_hue_cycling: true,
    },
    // 8 Thiên Hà Hỏa: deep space
    {
        shades: ['#0d0b2e', '#24125e', '#3d1f9e', '#6b4dff'],
        core: ['#7af7ff', '#ffffff'],
        glow: 'rgba(107, 77, 255, 0.45)',
        shard_colors: ['#6b4dff', '#7af7ff', '#ffffff'],
        is_hue_cycling: false,
    },
];

// Grows with the tier, so a higher flame always feels more alive
export const TIER_EFFECTS: readonly FlameEffects[] = [
    { shard_count: 2, ember_count: 0, glow_pulse: 0.04, has_stars: false },     // 0 a quiet spark
    { shard_count: 4, ember_count: 0, glow_pulse: 0.06, has_stars: false },     // 1
    { shard_count: 5, ember_count: 3, glow_pulse: 0.08, has_stars: false },     // 2 sparks start to fly
    { shard_count: 6, ember_count: 4, glow_pulse: 0.08, has_stars: false },     // 3
    { shard_count: 7, ember_count: 5, glow_pulse: 0.1, has_stars: false },      // 4
    { shard_count: 8, ember_count: 6, glow_pulse: 0.14, has_stars: false },     // 5 neon: the halo breathes harder
    { shard_count: 8, ember_count: 6, glow_pulse: 0.12, has_stars: false },     // 6
    { shard_count: 8, ember_count: 7, glow_pulse: 0.12, has_stars: false },     // 7
    { shard_count: 8, ember_count: 8, glow_pulse: 0.14, has_stars: true },      // 8 galaxy
];

// Flame color items from chests (ids match REWARD_CATALOG in core)
const RARE_FLAME_COLORS: Record<string, FlameColors> = {
    flame_ice: {
        shades: ['#2a7fa8', '#4fb3d9', '#8fdcf2', '#d6f6ff'],
        core: ['#bff3ff', '#ffffff'],
        glow: 'rgba(120, 220, 255, 0.45)',
        shard_colors: ['#8fdcf2', '#ffffff', '#4fb3d9'],
        is_hue_cycling: false,
    },
    flame_toxic: {
        shades: ['#2f7a0c', '#4fb01a', '#7fe03a', '#c4ff6e'],
        core: ['#f4ff9e', '#ffffff'],
        glow: 'rgba(127, 224, 58, 0.42)',
        shard_colors: ['#7fe03a', '#c4ff6e', '#b69cff'],
        is_hue_cycling: false,
    },
    flame_shadow: {
        shades: ['#0e0e10', '#1e1c22', '#2f2b36', '#4a4456'],
        core: ['#9a5bff', '#e0cfff'],
        glow: 'rgba(70, 35, 110, 0.45)',
        shard_colors: ['#2f2b36', '#9a5bff', '#4a4456'],
        is_hue_cycling: false,
    },
    flame_gold_24k: {
        shades: ['#7a4a00', '#b8860b', '#ffd700', '#fff6c2'],
        core: ['#ffffff', '#fffbe6'],
        glow: 'rgba(255, 196, 0, 0.55)',
        shard_colors: ['#ffd84d', '#fff6c2', '#b8860b'],
        is_hue_cycling: false,
    },
    flame_aurora: {
        shades: ['#0f5e6e', '#1fa58a', '#5fe0b0', '#c6ffe8'],
        core: ['#ff9cf0', '#ffffff'],
        glow: 'rgba(95, 224, 176, 0.45)',
        shard_colors: ['#5fe0b0', '#b69cff', '#ff9cf0'],
        is_hue_cycling: false,
    },
};

// Locked tiers are shown as a charcoal silhouette so their color stays a surprise
export const MYSTERY_COLORS: FlameColors = {
    shades: ['#2b2723', '#3a3530', '#4a443d', '#5c554c'],
    core: ['#6b645a', '#837a6e'],
    glow: 'rgba(60, 45, 25, 0.16)',
    shard_colors: ['#a49d92', '#7a7268'],
    is_hue_cycling: false,
};

// Calm effects for the silhouette, so a locked tier's extra sparkle does not leak either
export const MYSTERY_EFFECTS: FlameEffects = { shard_count: 3, ember_count: 0, glow_pulse: 0.04, has_stars: false };

const FOLLOW_TIER_ID = 'flame_follow_tier';
const TIER_COLOR_PREFIX = 'flame_tier_';

// Colors for a flame at `tier_index`, painted with the equipped color item.
// No item (or "follow tier") means the tier's own colors.
export function getFlameColors(tier_index: number, color_id: string | null = null): FlameColors
{
    const tier_colors = TIER_COLORS[tier_index] ?? TIER_COLORS[0];
    if (!color_id || color_id === FOLLOW_TIER_ID)
    {
        return tier_colors;
    }
    if (color_id.startsWith(TIER_COLOR_PREFIX))
    {
        return TIER_COLORS[Number(color_id.slice(TIER_COLOR_PREFIX.length))] ?? tier_colors;
    }
    return RARE_FLAME_COLORS[color_id] ?? tier_colors;
}

export function getFlameEffects(tier_index: number): FlameEffects
{
    return TIER_EFFECTS[tier_index] ?? TIER_EFFECTS[0];
}
