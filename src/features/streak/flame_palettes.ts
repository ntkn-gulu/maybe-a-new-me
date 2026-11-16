// Visual palette for each flame tier (index matches FLAME_TIERS in core).
// shades: 4 facet tones from darkest (side in shadow) to lightest (lit face).
// core: inner hot core, dark then light. glow: halo behind the flame.

export interface FlamePalette
{
    shades: [string, string, string, string];
    core: [string, string];
    glow: string;
    shard_colors: string[];
    effect: 'none' | 'rainbow' | 'galaxy';
}

export const FLAME_PALETTES: readonly FlamePalette[] = [
    // 0 Tinh Hỏa: dim ember
    {
        shades: ['#6b5246', '#8c6a58', '#b48a6e', '#dcb08e'],
        core: ['#eab48a', '#fff1e0'],
        glow: 'rgba(214, 150, 110, 0.35)',
        shard_colors: ['#b48a6e', '#d9cfbf', '#8c6a58'],
        effect: 'none',
    },
    // 1 Xích Hỏa: classic orange-red
    {
        shades: ['#c2300c', '#e8501a', '#ff7426', '#ffa04f'],
        core: ['#ffc94d', '#fff6d6'],
        glow: 'rgba(255, 90, 31, 0.38)',
        shard_colors: ['#ff5a1f', '#ffc21a', '#ff4d6d'],
        effect: 'none',
    },
    // 2 Kim Hỏa: gold
    {
        shades: ['#b86e00', '#e39600', '#ffbd14', '#ffde61'],
        core: ['#fff3b0', '#ffffff'],
        glow: 'rgba(255, 194, 26, 0.42)',
        shard_colors: ['#ffc21a', '#ffde61', '#ff7426'],
        effect: 'none',
    },
    // 3 Lam Hỏa: hot blue
    {
        shades: ['#1531b8', '#2d4bff', '#4f7dff', '#8fb2ff'],
        core: ['#a8f0ff', '#ffffff'],
        glow: 'rgba(45, 75, 255, 0.35)',
        shard_colors: ['#2d4bff', '#3ccfe0', '#8fb2ff'],
        effect: 'none',
    },
    // 4 Tử Hỏa: purple
    {
        shades: ['#4b1fa8', '#6f3de0', '#9466ff', '#c3a8ff'],
        core: ['#ffd1f5', '#ffffff'],
        glow: 'rgba(148, 102, 255, 0.38)',
        shard_colors: ['#9466ff', '#b69cff', '#ff4d6d'],
        effect: 'none',
    },
    // 5 Huyễn Hỏa: neon pink
    {
        shades: ['#b0105a', '#e61e78', '#ff4d9a', '#ff9cc8'],
        core: ['#ffe36e', '#ffffff'],
        glow: 'rgba(255, 77, 154, 0.45)',
        shard_colors: ['#ff4d9a', '#3ccfe0', '#ffe36e'],
        effect: 'none',
    },
    // 6 Bạch Hỏa: platinum white
    {
        shades: ['#8d98ab', '#b9c3d5', '#dfe6f2', '#ffffff'],
        core: ['#cfe9ff', '#ffffff'],
        glow: 'rgba(160, 190, 230, 0.5)',
        shard_colors: ['#dfe6f2', '#b9c3d5', '#cfe9ff'],
        effect: 'none',
    },
    // 7 Thất Sắc Hỏa: rainbow (hue keeps rotating)
    {
        shades: ['#c2300c', '#e8501a', '#ff7426', '#ffa04f'],
        core: ['#ffe36e', '#ffffff'],
        glow: 'rgba(255, 120, 200, 0.4)',
        shard_colors: ['#ff4d6d', '#ffc21a', '#3ccfe0', '#2d4bff', '#9466ff'],
        effect: 'rainbow',
    },
    // 8 Thiên Hà Hỏa: deep space with stars
    {
        shades: ['#0d0b2e', '#24125e', '#3d1f9e', '#6b4dff'],
        core: ['#7af7ff', '#ffffff'],
        glow: 'rgba(107, 77, 255, 0.45)',
        shard_colors: ['#6b4dff', '#7af7ff', '#ffffff'],
        effect: 'galaxy',
    },
];
