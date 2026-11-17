import { useId } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import {
    SKETCH_INK,
    createRandom,
    ellipsePoints,
    hatchLines,
    sketchOutline,
    smoothPath,
    wobblePoints,
} from '../../ui/sketch_draw';
import styles from './sketch_timer_dial.module.css';

// The sketch theme's kitchen-timer dial, drawn in a sketchbook: a paper face
// with a double-stroked ink ring, uneven hand-drawn hour ticks and a hatched
// shadow; the session length is red pen hatching inside the inner circle,
// the needle is one bold ink stroke and the hub is filled with ink.
// `sweep_degrees` is a spring value owned by the Focus screen (6° per minute).
//
// Smooth on iPhone: every line is plain vector geometry computed once
// (sketch_draw.ts, no SVG filters). While the dial turns only the wedge
// that reveals the red hatching changes, and the needle is its own layer
// rotated by the GPU.

const CENTER = 100;                   // viewBox 0 0 200 200
const VIEW_BOX = '0 0 200 200';
const FACE_RADIUS = 92;
const DISC_RADIUS = 66;
const MAX_WEDGE_DEGREES = 359.9;      // a full 360 arc would collapse to nothing
const NEEDLE_LENGTH = 58;
const HUB_RADIUS = 8;
const TICK_COUNT = 12;
const RED_PEN = '#d1342b';
const PAPER = 'var(--tile-face, #fbf7ef)';

// ---------- Drawn once when the module loads ----------

const FACE_POINTS = ellipsePoints(CENTER, CENTER, FACE_RADIUS, FACE_RADIUS, 56);
const DISC_POINTS = ellipsePoints(CENTER, CENTER, DISC_RADIUS, DISC_RADIUS, 44);

const SHADOW_HATCH = hatchLines(ellipsePoints(CENTER + 5, CENTER + 6, FACE_RADIUS, FACE_RADIUS, 48), { angle: 45, gap: 4.5, seed: 3 });
// The ring is drawn twice, a little apart, like a pen going round again
const FACE_RING = sketchOutline(FACE_POINTS, 1.2, 5, 4);
const FACE_RING_ECHO = sketchOutline(FACE_POINTS, 1.8, 6, 3);
const DISC_RING = sketchOutline(DISC_POINTS, 1, 7, 3);
const DISC_HATCH = hatchLines(DISC_POINTS, { angle: 50, gap: 4.6, seed: 9 });
const HUB = smoothPath(wobblePoints(ellipsePoints(CENTER, CENTER, HUB_RADIUS, HUB_RADIUS, 12), { amplitude: 0.6, seed: 11 }), true);
// Needle pointing at 12 o'clock with a slightly bent hand-drawn stroke
const NEEDLE = `M${CENTER} ${CENTER + 2} Q${CENTER - 1.6} ${CENTER - NEEDLE_LENGTH / 2} ${CENTER + 0.6} ${CENTER - NEEDLE_LENGTH}`;

// Hour ticks of uneven length and angle, as a steady but human hand draws them
function buildTicks(): string
{
    const random = createRandom(13);
    return Array.from({ length: TICK_COUNT }, (_, index) =>
    {
        const is_major = index % 3 === 0;
        const angle = ((index * 30 + (random() - 0.5) * 3) * Math.PI) / 180;
        const inner = (is_major ? 76 : 80) - random() * 3;
        const outer = 87 + random() * 2;
        const x1 = CENTER + inner * Math.sin(angle);
        const y1 = CENTER - inner * Math.cos(angle);
        const x2 = CENTER + outer * Math.sin(angle);
        const y2 = CENTER - outer * Math.cos(angle);
        return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }).join('');
}

const MAJOR_TICKS = buildTicks();

// Pie slice from 12 o'clock, clockwise, to `degrees` (reveals the red hatching)
function wedgePath(degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0), MAX_WEDGE_DEGREES);
    const radians = (clamped * Math.PI) / 180;
    const end_x = CENTER + DISC_RADIUS * Math.sin(radians);
    const end_y = CENTER - DISC_RADIUS * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - DISC_RADIUS} `
        + `A ${DISC_RADIUS} ${DISC_RADIUS} 0 ${large_arc} 1 ${end_x} ${end_y} Z`;
}

interface SketchTimerDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function SketchTimerDial(props: SketchTimerDialProps)
{
    const wedge_d = useTransform(props.sweep_degrees, wedgePath);
    const clip_id = `dial-wedge-${useId()}`;

    return (
        <div className={styles.dial}>
            {/* Static paper, ink and shadow */}
            <svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true">
                <path d={SHADOW_HATCH} stroke={SKETCH_INK} strokeWidth={1.1} strokeLinecap="round" opacity={0.5} />
                <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill={PAPER} />
                <g fill="none" stroke={SKETCH_INK} strokeLinecap="round" strokeLinejoin="round">
                    <path d={FACE_RING} strokeWidth={2.6} />
                    <path d={FACE_RING_ECHO} strokeWidth={1.2} opacity={0.55} />
                    <path d={DISC_RING} strokeWidth={2} />
                    <path d={MAJOR_TICKS} strokeWidth={2.4} />
                </g>
            </svg>

            {/* The only part that redraws while the dial turns */}
            <svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true">
                <defs>
                    <clipPath id={clip_id}>
                        <motion.path d={wedge_d} />
                    </clipPath>
                </defs>
                <g clipPath={`url(#${clip_id})`}>
                    <path d={DISC_HATCH} stroke={RED_PEN} strokeWidth={1.7} strokeLinecap="round" />
                </g>
                <motion.path d={wedge_d} fill="none" stroke={RED_PEN} strokeWidth={2} strokeLinejoin="round" />
            </svg>

            {/* Needle turned by the GPU */}
            <motion.svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true" style={{ rotate: props.sweep_degrees }}>
                <path d={NEEDLE} fill="none" stroke={SKETCH_INK} strokeWidth={5} strokeLinecap="round" />
            </motion.svg>

            <svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true">
                <path d={HUB} fill={SKETCH_INK} />
            </svg>
        </div>
    );
}
