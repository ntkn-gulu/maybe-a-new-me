import {
    clipToHalfPlane,
    hatchLines,
    samplePath,
    scalePoints,
    sketchOutline,
    smoothPath,
    wobblePoints,
    type Point,
} from '../../ui/sketch_draw';
import type { FlameColors } from './flame_palettes';

// The geometry of the sketch-theme flame ("marker + ink"), built once per
// tier / color with sketch_draw.ts: plain path data, no SVG filters.
// Bold black ink outlines (outer flame, middle flame, teardrop core) over
// flat marker color that slips a little past the lines like quick
// coloring, ink hatching on the shaded right side and a white shine.

// Three-tongue flame silhouette (viewBox 0 0 200 260), base at (100, 248)
export const FLAME_PATH = 'M100 12 C108 46 126 66 132 92 C140 80 146 68 146 54 C166 84 176 120 172 160 '
    + 'C168 214 136 248 100 248 C62 248 30 214 30 168 C30 130 40 100 52 62 C64 84 70 100 76 112 C74 76 84 44 100 12 Z';
// Hot teardrop core in the middle of the flame
const CORE_PATH = 'M100 128 C112 152 128 174 126 202 C124 228 112 242 100 242 C88 242 76 228 74 204 C72 178 88 152 100 128 Z';
// Cartoon shine along the lit (left) side
const SHINE_PATH = 'M48 198 C42 178 43 158 50 140';

export const FLAME_VIEW_BOX = '0 0 200 260';
export const FLAME_VIEW_WIDTH = 200;
export const FLAME_VIEW_HEIGHT = 260;
export const FLAME_BASE_Y = 248;
export const INK_COLOR = '#1f1c18';

const FLAME_BASE: Point = [100, FLAME_BASE_Y];
const FLAME_POINTS = samplePath(FLAME_PATH, 8);
const MIDDLE_POINTS = scalePoints(FLAME_POINTS, 0.72, FLAME_BASE, [-2, 0]);
const CORE_POINTS = samplePath(CORE_PATH, 8);
const SHADOW_SIDE_X = 118;            // the right of this line is the shaded side
const BOIL_SEEDS = [101, 202, 303];   // one set of outlines per line-boil frame
const OUTLINE_WOBBLE = 1.6;           // viewBox units the line strays from the true shape
const OUTLINE_OVERSHOOT = 3;          // points drawn past the start (the pen does not stop exactly)
const OUTER_WIDTH = 3;
const INNER_WIDTH = 1.6;

// One drawn piece: a filled shape or a set of strokes
export interface SketchPiece
{
    d: string;
    fill?: string;
    stroke?: string;
    width?: number;
    opacity?: number;
}

export interface SketchFlameArt
{
    body: SketchPiece[];                  // the color work, pops in after the outline starts
    outline_frames: SketchPiece[][];      // the ink lines, three versions for the line boil
    spark_fill: string;
}

// The same points moved, so the marker color slips past the ink line
function shifted(points: Point[], dx: number, dy: number): Point[]
{
    return points.map(([x, y]) => [x + dx, y + dy]);
}

// Outer flame, middle flame and core outlines for one boil frame
function outlineSet(seed: number): SketchPiece[]
{
    return [
        { d: sketchOutline(FLAME_POINTS, OUTLINE_WOBBLE, seed, OUTLINE_OVERSHOOT), stroke: INK_COLOR, width: OUTER_WIDTH },
        { d: sketchOutline(MIDDLE_POINTS, OUTLINE_WOBBLE * 0.8, seed + 1, OUTLINE_OVERSHOOT), stroke: INK_COLOR, width: INNER_WIDTH },
        { d: sketchOutline(CORE_POINTS, OUTLINE_WOBBLE * 0.6, seed + 2, OUTLINE_OVERSHOOT), stroke: INK_COLOR, width: INNER_WIDTH },
    ];
}

export function buildSketchFlameArt(colors: FlameColors): SketchFlameArt
{
    return {
        body: [
            { d: smoothPath(wobblePoints(shifted(FLAME_POINTS, 5, 3), { amplitude: 2.5, seed: 51 }), true), fill: colors.shades[2], opacity: 0.95 },
            { d: smoothPath(wobblePoints(shifted(MIDDLE_POINTS, 4, 3), { amplitude: 2, seed: 53 }), true), fill: colors.shades[3], opacity: 0.95 },
            { d: smoothPath(wobblePoints(shifted(CORE_POINTS, 3, 2), { amplitude: 1.5, seed: 57 }), true), fill: colors.core[1] },
            { d: hatchLines(clipToHalfPlane(FLAME_POINTS, [1, 0], SHADOW_SIDE_X), { angle: 52, gap: 4, seed: 59 }), stroke: INK_COLOR, width: 1.1, opacity: 0.55 },
            { d: SHINE_PATH, stroke: '#ffffff', width: 4, opacity: 0.8 },
        ],
        outline_frames: BOIL_SEEDS.map(outlineSet),
        spark_fill: colors.shades[3],
    };
}

// ---------- Small pieces ----------

// Little flame tip for sparks, viewBox 0 0 12 15
export const SPARK_VIEW_BOX = '-2 -2 16 19';
const SPARK_POINTS = samplePath('M6 1 C9 6 11 10 6 14 C1 10 3 6 6 1 Z', 6);
export const SPARK_OUTLINE = sketchOutline(SPARK_POINTS, 0.3, 9, 2);

// Badge-size flame for the tier strip (same viewBox; thick lines so it reads at ~30 px)
const MINI_POINTS = samplePath(FLAME_PATH, 6);
export const MINI_FLAME_OUTLINE = sketchOutline(MINI_POINTS, 5, 61, 3);
export const MINI_FLAME_MARKER = smoothPath(wobblePoints(shifted(MINI_POINTS, 10, 6), { amplitude: 5, seed: 67 }), true);
