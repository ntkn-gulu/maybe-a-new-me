import { motion, type MotionValue } from 'motion/react';
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
import styles from './record_deck.module.css';

// The sketch theme's player: a cassette tape in marker + ink. The two reels
// turn while playing (rotation from useSpin); the tape wound on the left
// reel is thicker, like a tape near its start. A small "play" light sits on
// the label. Plain vector geometry computed once (no SVG filters).

interface SketchCassetteProps
{
    rotate: MotionValue<number>;
    is_powered: boolean;
}

const MARKER_SLIP: Point = [3, 3];
const EDGE_STEP = 9;

const BODY: Point[] = [[20, 34], [220, 34], [224, 40], [224, 166], [218, 172], [22, 172], [16, 166], [16, 40]];
const LABEL: Point[] = [[34, 48], [206, 48], [206, 118], [34, 118]];
const WINDOW: Point[] = [[74, 72], [166, 72], [166, 102], [74, 102]];
const BASE: Point[] = [[62, 172], [76, 146], [164, 146], [178, 172]];
const REELS: Point[] = [[100, 87], [140, 87]];
const SCREWS: Point[] = [[28, 46], [212, 46], [28, 160], [212, 160], [120, 160]];

function markerShape(points: Point[], seed: number): string
{
    const slipped = points.map(([x, y]): Point => [x + MARKER_SLIP[0], y + MARKER_SLIP[1]]);
    return smoothPath(wobblePoints(densifyPolygon(slipped, EDGE_STEP), { amplitude: 1.4, seed }), true);
}

function inkOutline(points: Point[], seed: number): string
{
    return sketchOutline(densifyPolygon(points, EDGE_STEP), 1, seed, 2);
}

function inkCircle(center: Point, radius: number, seed: number): string
{
    return sketchOutline(ellipsePoints(center[0], center[1], radius, radius, Math.max(8, Math.round(radius))), 0.5, seed, 1);
}

const BODY_FILL = markerShape(BODY, 11);
const LABEL_FILL = markerShape(LABEL, 12);
const BASE_HATCH = hatchLines(BASE, { angle: 60, gap: 4.5, seed: 13 });
const TAPE_FILLS = [
    smoothPath(wobblePoints(ellipsePoints(REELS[0][0], REELS[0][1], 14.5, 14.5, 14), { amplitude: 0.8, seed: 14 }), true),
    smoothPath(wobblePoints(ellipsePoints(REELS[1][0], REELS[1][1], 12, 12, 12), { amplitude: 0.8, seed: 15 }), true),
];
const OUTLINES = [
    inkOutline(BODY, 21),
    inkOutline(LABEL, 22),
    inkOutline(WINDOW, 23),
    inkOutline(BASE, 24),
    ...SCREWS.map((screw, index) => inkCircle(screw, 3.2, 30 + index)),
].join(' ');
// Writing lines on the label, like a handwritten track list
const LABEL_LINES = 'M46 60 C80 58 120 61 150 59 M46 108 C70 107 96 109 118 107';

// One reel: hub ring with six teeth, drawn around its own center so it can turn
function Reel(props: { center: Point; seed: number; rotate: MotionValue<number> })
{
    const [x, y] = props.center;
    const teeth = Array.from({ length: 6 }, (_, index) =>
    {
        const angle = (index / 6) * Math.PI * 2;
        return `M${(x + 5 * Math.cos(angle)).toFixed(1)} ${(y + 5 * Math.sin(angle)).toFixed(1)}`
            + `L${(x + 9 * Math.cos(angle)).toFixed(1)} ${(y + 9 * Math.sin(angle)).toFixed(1)}`;
    }).join('');
    return (
        <motion.g style={{ rotate: props.rotate }}>
            <circle cx={x} cy={y} r="10" fill="#ffffff" />
            <path d={inkCircle(props.center, 10, props.seed)} />
            <path d={teeth} strokeWidth={2} />
        </motion.g>
    );
}

export function SketchCassette(props: SketchCassetteProps)
{
    return (
        <svg className={styles.art} viewBox="0 0 240 196" aria-hidden="true">
            <path d={BODY_FILL} fill="#3a3530" />
            <path d={LABEL_FILL} fill="var(--color-accent)" opacity="0.85" />
            <path d={`M${WINDOW.map((point) => point.join(' ')).join(' L')} Z`} fill="#f6f1e7" />
            {TAPE_FILLS.map((d) => <path key={d} d={d} fill="#5b4a3a" />)}
            <g fill="none" stroke={SKETCH_INK} strokeLinecap="round" strokeLinejoin="round">
                <path d={BASE_HATCH} stroke="#f6f1e7" strokeWidth={1.2} opacity={0.5} />
                <path d={OUTLINES} strokeWidth={2.4} />
                <path d={LABEL_LINES} stroke="#ffffff" strokeWidth={2.2} opacity={0.8} />
                <Reel center={REELS[0]} seed={41} rotate={props.rotate} />
                <Reel center={REELS[1]} seed={42} rotate={props.rotate} />
            </g>
            <circle cx="196" cy="62" r="4.5" fill={props.is_powered ? '#ff4d6d' : '#8c8478'} stroke={SKETCH_INK} strokeWidth={1.6} />
        </svg>
    );
}
