import { motion } from 'motion/react';
import { createRandom, ellipsePoints, sketchOutline, type Point } from './sketch_draw';
import styles from './sketch_marks.module.css';

// Small hand-drawn marks for the sketch theme, shown only there (sk-only):
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

interface MarkProps
{
    variant?: number;             // any number; picks one of the precomputed drawings
    delay?: number;               // seconds before the pen starts
}

function pickVariant(paths: string[], variant: number | undefined): string
{
    return paths[Math.abs(variant ?? 0) % paths.length];
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
