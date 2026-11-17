import {
    SKETCH_INK,
    densifyPolygon,
    ellipsePoints,
    hatchLines,
    sketchOutline,
    smoothPath,
    wobblePoints,
    type Point,
} from '../../ui/sketch_draw';
import styles from './sketch_rarity_gem.module.css';

// Rarity icons for the sketch theme, in the marker + ink style of the flame
// and chest: marker color slipping past a wobbly ink outline, facet lines,
// ink hatching on the shaded facet. Each rarity has its own shape, and
// the rarer it is the fancier it gets:
// - common:    a gray pebble
// - rare:      a cut blue diamond
// - epic:      a tall purple crystal (gently bobs)
// - legendary: a big gold diamond with doodled rays (wobbles)
// Geometry computed once (sketch_draw.ts, no SVG filters); 40 x 40 box.

export type RarityKey = 'common' | 'rare' | 'epic' | 'legendary';

const MARKER_SLIP: Point = [1.6, 1.2];
const EDGE_STEP = 3;

interface GemDrawing
{
    marker: string;
    marker_color: string;
    hatch: string;
    facets: string;
    outline: string;
    rays: string;                 // legendary only
}

function slipped(points: Point[]): Point[]
{
    return points.map(([x, y]) => [x + MARKER_SLIP[0], y + MARKER_SLIP[1]]);
}

function drawGem(shape: Point[], shaded: Point[], facets: string, color: string, seed: number, rays = ''): GemDrawing
{
    return {
        marker: smoothPath(wobblePoints(densifyPolygon(slipped(shape), EDGE_STEP), { amplitude: 0.7, seed }), true),
        marker_color: color,
        hatch: hatchLines(shaded, { angle: 55, gap: 2.2, seed: seed + 1, inset: 0.4 }),
        facets,
        outline: sketchOutline(densifyPolygon(shape, EDGE_STEP), 0.5, seed + 2, 2),
        rays,
    };
}

// Cut diamond: table on top, girdle across, point at the bottom
const DIAMOND: Point[] = [[12, 8], [28, 8], [36, 17], [20, 35], [4, 17]];
const DIAMOND_SHADED: Point[] = [[24, 17], [36, 17], [20, 35]];
const DIAMOND_FACETS = 'M4.5 17 L35.5 17 M12 8.2 L16 17 M28 8.2 L24 17 M16 17 L20 34 M24 17 L20 34';

// Tall hexagonal crystal
const CRYSTAL: Point[] = [[20, 3], [31, 10], [31, 29], [20, 37], [9, 29], [9, 10]];
const CRYSTAL_SHADED: Point[] = [[20, 16], [31, 10], [31, 29], [20, 37]];
const CRYSTAL_FACETS = 'M9.5 10.3 L20 16 L30.5 10.3 M20 16 L20 36.5';

// Doodled rays around the legendary gem
const LEGENDARY_RAYS = 'M20 1.5 L20 4.5 M37.5 8 L35 10 M2.5 8 L5 10 M38.5 25 L35.5 24.5 M1.5 25 L4.5 24.5';

const PEBBLE = ellipsePoints(20, 22, 14, 10.5, 18);

const GEMS: Record<RarityKey, GemDrawing> = {
    common: {
        marker: smoothPath(wobblePoints(slipped(PEBBLE), { amplitude: 1.1, seed: 3 }), true),
        marker_color: '#bdb6aa',
        hatch: hatchLines(PEBBLE.filter(([x]) => x > 20).concat([[20, 32.5], [20, 11.5]]), { angle: 55, gap: 2.4, seed: 4, inset: 0.4 }),
        facets: 'M13 18 C15 16.5 17 16.2 19 16.8',
        outline: sketchOutline(PEBBLE, 0.9, 5, 3),
        rays: '',
    },
    rare: drawGem(DIAMOND, DIAMOND_SHADED, DIAMOND_FACETS, '#6ab8ff', 11),
    epic: drawGem(CRYSTAL, CRYSTAL_SHADED, CRYSTAL_FACETS, '#b994ff', 21),
    legendary: drawGem(DIAMOND, DIAMOND_SHADED, DIAMOND_FACETS, '#ffc93a', 31, LEGENDARY_RAYS),
};

interface SketchRarityGemProps
{
    rarity: RarityKey;
}

export function SketchRarityGem(props: SketchRarityGemProps)
{
    const gem = GEMS[props.rarity];
    return (
        <svg className={`${styles.gem} ${styles[props.rarity]}`} viewBox="0 0 40 40" aria-hidden="true">
            <path d={gem.marker} fill={gem.marker_color} />
            <g fill="none" stroke={SKETCH_INK} strokeLinecap="round" strokeLinejoin="round">
                <path d={gem.hatch} strokeWidth={0.9} opacity={0.55} />
                <path d={gem.facets} strokeWidth={1.1} opacity={0.8} />
                <path d="M9 13 L11.5 10.5" stroke="#ffffff" strokeWidth={1.8} opacity={0.85} />
                <path d={gem.outline} strokeWidth={1.8} />
                {gem.rays && <path d={gem.rays} stroke="#e09000" strokeWidth={1.8} />}
            </g>
        </svg>
    );
}
