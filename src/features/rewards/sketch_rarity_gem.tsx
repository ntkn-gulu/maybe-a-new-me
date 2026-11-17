import {
    SKETCH_INK,
    createRandom,
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
//
// SketchRarityDoodles fills the rest of the rarity card with loose marker
// doodles in the rarity color (more of them on rarer cards), kept to the
// right half and the bottom edge so they never sit under the text.

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

// ---------- Card doodles ----------

interface Doodle
{
    d: string;
    width: number;                // px (the doodle box stretches over the card)
}

const DOODLE_COUNTS: Record<RarityKey, number> = { common: 5, rare: 6, epic: 7, legendary: 8 };
const DOODLE_SEEDS: Record<RarityKey, number> = { common: 201, rare: 301, epic: 401, legendary: 501 };

type DoodleMaker = (x: number, y: number, random: () => number) => Doodle;

function format(value: number): string
{
    return value.toFixed(1);
}

// Wavy line
const squiggle: DoodleMaker = (x, y, random) =>
{
    const amplitude = 3 + random() * 2;
    let d = `M${format(x)} ${format(y)}`;
    for (let wave = 0; wave < 4; wave++)
    {
        const sign = wave % 2 === 0 ? -1 : 1;
        d += ` q5 ${format(sign * amplitude * 2)} 10 0`;
    }
    return { d, width: 3 };
};

// Cursive loops, like testing a pen
const loops: DoodleMaker = (x, y) => ({
    d: `M${format(x)} ${format(y)} c6 -10 12 -6 6 0 c-6 6 6 8 10 -2 c4 -8 10 -4 6 2 c-4 6 6 6 10 -2`,
    width: 2.6,
});

// A few dots (zero-length round-capped lines)
const dots: DoodleMaker = (x, y, random) => ({
    d: Array.from({ length: 3 }, (_, index) =>
        `M${format(x + index * 9 + random() * 4)} ${format(y + (random() - 0.5) * 10)} l0.01 0`).join(' '),
    width: 5,
});

// Asterisk star
const asterisk: DoodleMaker = (x, y) => ({
    d: `M${format(x)} ${format(y - 6)} l0 12 M${format(x - 5.5)} ${format(y - 3)} l11 6 M${format(x - 5.5)} ${format(y + 3)} l11 -6`,
    width: 2.4,
});

// Small patch of hatching
const hatchPatch: DoodleMaker = (x, y) => ({
    d: Array.from({ length: 5 }, (_, index) => `M${format(x + index * 5)} ${format(y + 6)} l7 -12`).join(' '),
    width: 2.6,
});

// Little circle
const ring: DoodleMaker = (x, y, random) =>
{
    const radius = 4 + random() * 3;
    return { d: `M${format(x - radius)} ${format(y)} a${format(radius)} ${format(radius)} 0 1 0 ${format(radius * 2)} 0 a${format(radius)} ${format(radius)} 0 1 0 ${format(-radius * 2)} 0`, width: 2.4 };
};

const DOODLE_MAKERS: DoodleMaker[] = [squiggle, loops, dots, asterisk, hatchPatch, ring];

// Free spots (viewBox 0 0 200 90) away from the gem, label and rate text
const DOODLE_SPOTS: [number, number][] = [[128, 40], [160, 52], [120, 64], [176, 34], [142, 26], [186, 62], [84, 74], [150, 72], [108, 48]];

function buildDoodles(rarity: RarityKey): Doodle[]
{
    const random = createRandom(DOODLE_SEEDS[rarity]);
    // A broad marker swoosh along the bottom right, then small doodles
    const swoosh_y = 74 + random() * 4;
    const doodles: Doodle[] = [{
        d: `M${format(96 + random() * 10)} ${format(swoosh_y)} Q150 ${format(swoosh_y - 10 - random() * 6)} ${format(184 + random() * 5)} ${format(swoosh_y - 4)}`,
        width: 9,
    }];
    const spots = [...DOODLE_SPOTS].sort(() => random() - 0.5);
    for (let index = 0; index < DOODLE_COUNTS[rarity] - 1; index++)
    {
        const maker = DOODLE_MAKERS[Math.floor(random() * DOODLE_MAKERS.length)];
        const [x, y] = spots[index % spots.length];
        doodles.push(maker(x + (random() - 0.5) * 8, y + (random() - 0.5) * 6, random));
    }
    return doodles;
}

const CARD_DOODLES: Record<RarityKey, Doodle[]> = {
    common: buildDoodles('common'),
    rare: buildDoodles('rare'),
    epic: buildDoodles('epic'),
    legendary: buildDoodles('legendary'),
};

export function SketchRarityDoodles(props: SketchRarityGemProps)
{
    return (
        <svg className={styles.doodles} viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true">
            {CARD_DOODLES[props.rarity].map((doodle) => (
                <path key={doodle.d} d={doodle.d} strokeWidth={doodle.width} vectorEffect="non-scaling-stroke" />
            ))}
        </svg>
    );
}
