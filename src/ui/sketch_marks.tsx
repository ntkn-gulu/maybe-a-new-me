import { motion } from 'motion/react';
import { createRandom, ellipsePoints, sketchOutline, type Point } from './sketch_draw';
import styles from './sketch_marks.module.css';

// Small hand-drawn marks for the sketch theme, shown only there (sk-only):
// - MarkerFill:   marker coloring inside an sk-marker frame (accent buttons)
// - ScribbleMark: a quick zigzag that scribbles out a box (a finished goal pip)
// - CircleMark:   a marker loop around something (a kept day in the calendar)
// Plain vector paths computed once (a few variants, picked by `variant`), drawn
// in with pathLength when they appear.

const VARIANT_COUNT = 4;
const PEN_EASE = [0.5, 0, 0.2, 1] as const;

// Zigzag across a 0..20 box, back and forth from top-left to bottom-right
function buildScribble(seed: number): string
{
    const random = createRandom(seed);
    const rows = 5;
    const points: Point[] = [];
    for (let row = 0; row < rows; row++)
    {
        const y = 3 + (row / (rows - 1)) * 14 + (random() - 0.5) * 1.6;
        const left: Point = [2 + random() * 2, y + (random() - 0.5) * 2];
        const right: Point = [17 + random() * 2, y - 1.5 + (random() - 0.5) * 2];
        points.push(...(row % 2 === 0 ? [left, right] : [right, left]));
    }
    return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
}

// Open marker loop in a 0..40 box that overshoots its start
function buildCircle(seed: number): string
{
    return sketchOutline(ellipsePoints(20, 20, 17, 15.5, 20), 1.2, seed, 5);
}

const SCRIBBLES = Array.from({ length: VARIANT_COUNT }, (_, index) => buildScribble(31 + index));
const CIRCLES = Array.from({ length: VARIANT_COUNT }, (_, index) => buildCircle(41 + index));

// ---------- Marker coloring ----------

// Back-and-forth marker strokes filling a 0..100 box (stretched over any
// button; the stroke width stays in px). Each pass is a little tilted and
// bent, starts and stops at uneven places, and overlaps its neighbors,
// where the semi-transparent marker gets darker, like real coloring.
function buildMarkerRows(rows: number, seed: number): string[]
{
    const random = createRandom(seed);
    const band = 100 / rows;
    return Array.from({ length: rows }, (_, row) =>
    {
        const y = band * (row + 0.5) + (random() - 0.5) * band * 0.3;
        const start_x = random() * 3;
        const end_x = 97 + random() * 4;
        const start_y = y + (random() - 0.5) * band * 0.5;
        const end_y = y + (random() - 0.5) * band * 0.5;
        const bend_y = y + (random() - 0.5) * band * 0.45;
        const from_left = row % 2 === 0;
        const [x1, y1, x2, y2] = from_left ? [start_x, start_y, end_x, end_y] : [end_x, end_y, start_x, start_y];
        return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q50 ${bend_y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    });
}

const MARKER_ROW_COUNTS = [3, 4, 5] as const;
export type MarkerRows = typeof MARKER_ROW_COUNTS[number];
const MARKER_FILLS: Record<number, string[][]> = Object.fromEntries(MARKER_ROW_COUNTS.map((rows) => [
    rows,
    Array.from({ length: VARIANT_COUNT }, (_, index) => buildMarkerRows(rows, 51 + rows * 10 + index)),
]));

interface MarkerFillProps
{
    rows: MarkerRows;             // passes of the marker; taller boxes need more
    variant?: number;
}

// Marker coloring behind an sk-marker frame's ink outline, in --sk-fill
export function MarkerFill(props: MarkerFillProps)
{
    const passes = pickVariant(MARKER_FILLS[props.rows], props.variant);
    return (
        <svg className={`${styles.marker} sk-only`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {passes.map((d) => <path key={d} d={d} vectorEffect="non-scaling-stroke" />)}
        </svg>
    );
}

interface MarkProps
{
    variant?: number;             // any number; picks one of the precomputed drawings
    delay?: number;               // seconds before the pen starts
}

function pickVariant<T>(items: T[], variant: number | undefined): T
{
    return items[Math.abs(variant ?? 0) % items.length];
}

export function ScribbleMark(props: MarkProps)
{
    return (
        <svg className={`${styles.scribble} sk-only`} viewBox="0 0 20 20" aria-hidden="true">
            <motion.path
                d={pickVariant(SCRIBBLES, props.variant)}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: props.delay ?? 0, ease: PEN_EASE }}
            />
        </svg>
    );
}

export function CircleMark(props: MarkProps)
{
    return (
        <svg className={`${styles.circle} sk-only`} viewBox="0 0 40 40" aria-hidden="true">
            <motion.path
                d={pickVariant(CIRCLES, props.variant)}
                style={{ rotate: ((props.variant ?? 0) % 3) * 40 - 40 }}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: props.delay ?? 0, ease: PEN_EASE }}
            />
        </svg>
    );
}
