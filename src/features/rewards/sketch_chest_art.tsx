import {
    SKETCH_INK,
    densifyPolygon,
    hatchLines,
    sketchOutline,
    smoothPath,
    wobblePoints,
    type Point,
} from '../../ui/sketch_draw';

// The sketch theme's treasure chest in marker + ink (like the flame):
// marker color that slips a little past the lines, ink hatching on the
// shaded side faces, wobbly hand-drawn ink outlines. All plain vector
// geometry computed once (sketch_draw.ts, no SVG filters); floating and
// rattling are done by the parent, which moves the finished picture.

const VIEW_BOX = '0 0 200 180';
const MARKER_SLIP: Point = [4, 3];    // the marker color lands a little down-right of the ink
const EDGE_STEP = 9;                  // densify edges so the wobble bends them, corners stay sharp

const CHEST_COLORS = {
    body_front: '#ffb400',
    body_side: '#e39a00',
    lid_front: '#ffc93a',
    lid_side: '#eba200',
    lid_top: '#ffdb6b',
    band: '#2a2622',
    lock: '#ff4d6d',
};

interface ChestFace
{
    points: Point[];
    color: string;
    is_shaded: boolean;           // side faces get ink hatching
}

// Faces back to front (2.5D: front, right side, top of the lid)
const FACES: ChestFace[] = [
    { points: [[24, 88], [128, 88], [128, 160], [24, 160]], color: CHEST_COLORS.body_front, is_shaded: false },
    { points: [[128, 88], [176, 64], [176, 136], [128, 160]], color: CHEST_COLORS.body_side, is_shaded: true },
    { points: [[24, 88], [128, 88], [128, 56], [24, 56]], color: CHEST_COLORS.lid_front, is_shaded: false },
    { points: [[128, 88], [176, 64], [176, 32], [128, 56]], color: CHEST_COLORS.lid_side, is_shaded: true },
    { points: [[24, 56], [128, 56], [176, 32], [72, 32]], color: CHEST_COLORS.lid_top, is_shaded: false },
];

// The dark band over the front and the lid, and the lock
const BAND: Point[][] = [
    [[66, 56], [86, 56], [86, 160], [66, 160]],
    [[72, 32], [92, 32], [86, 56], [66, 56]],
];
const LOCK: Point[] = [[62, 78], [90, 78], [90, 103], [62, 103]];

function slipped(points: Point[]): Point[]
{
    return points.map(([x, y]) => [x + MARKER_SLIP[0], y + MARKER_SLIP[1]]);
}

function markerShape(points: Point[], seed: number): string
{
    return smoothPath(wobblePoints(densifyPolygon(slipped(points), EDGE_STEP), { amplitude: 1.6, seed }), true);
}

function inkOutline(points: Point[], seed: number): string
{
    return sketchOutline(densifyPolygon(points, EDGE_STEP), 1.1, seed, 2);
}

const MARKER_SHAPES = FACES.map((face, index) => ({ d: markerShape(face.points, 20 + index), color: face.color }));
const SIDE_HATCH = FACES.filter((face) => face.is_shaded)
    .map((face, index) => hatchLines(face.points, { angle: 60, gap: 4.2, seed: 40 + index }))
    .join('');
const BAND_SHAPES = BAND.map((points, index) => markerShape(points, 60 + index));
const LOCK_SHAPE = markerShape(LOCK, 70);
const INK_OUTLINES = [...FACES.map((face) => face.points), ...BAND, LOCK]
    .map((points, index) => inkOutline(points, 80 + index))
    .join(' ');

interface SketchChestArtProps
{
    size?: number;
}

export function SketchChestArt(props: SketchChestArtProps)
{
    const width = props.size ?? 200;
    return (
        <svg viewBox={VIEW_BOX} width={width} height={width * 0.9} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
            {MARKER_SHAPES.map((shape) => <path key={shape.d} d={shape.d} fill={shape.color} />)}
            {BAND_SHAPES.map((d) => <path key={d} d={d} fill={CHEST_COLORS.band} />)}
            <path d={LOCK_SHAPE} fill={CHEST_COLORS.lock} />

            <g fill="none" stroke={SKETCH_INK} strokeLinecap="round" strokeLinejoin="round">
                <path d={SIDE_HATCH} strokeWidth={1.2} opacity={0.6} />
                {/* Shine on the lid edge, then the ink */}
                <path d="M30 61 L84 61" stroke="#ffffff" strokeWidth={3.5} opacity={0.75} />
                <path d={INK_OUTLINES} strokeWidth={2.6} />
            </g>

            {/* Keyhole */}
            <circle cx={76} cy={87} r={3.5} fill={SKETCH_INK} />
            <path d="M76 88 L76 95" stroke={SKETCH_INK} strokeWidth={3} strokeLinecap="round" />
        </svg>
    );
}
