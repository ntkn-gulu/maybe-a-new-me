import { motion, useTransform, type MotionValue } from 'motion/react';
import { INK_ROUGH_FILTER, PAPER_LIFT_FILTER } from '../../ui/ink_filters';
import styles from './timer_dial.module.css';

// Kitchen-timer dial in the paper + ink style of the flame: a paper face,
// a pink paper disc and a blue paper needle, all outlined in hand-drawn ink.
// The lighter wedge shows the session length; the needle sits at its end.
// `sweep_degrees` is a spring value owned by the Focus screen (6° per minute).
//
// Stacked layers, so turning the dial stays smooth on iPhone: the paper face and
// the inked ticks are drawn once; only the small wedge path redraws while the
// spring runs, and the needle turns as an HTML layer (GPU rotation, no redraw).

const CENTER = 100;                   // viewBox 0 0 200 200
const FACE_RADIUS = 94;
const DISC_RADIUS = 64;
const TICK_COUNT = 60;
const TICK_OUTER = 88;
const TICK_INNER_MINOR = 83;
const TICK_INNER_MAJOR = 76;
const WEDGE_RADIUS = 80;              // larger than the disc; the disc clip hides the arc edge
const MAX_WEDGE_DEGREES = 359.9;      // a full 360 arc would collapse to nothing
const NEEDLE_WIDTH = 11;
const NEEDLE_TOP = 46;                // y of the needle tip
const HUB_RADIUS = 14;

const INK_COLOR = '#1f1c18';
const FACE_COLOR = '#fbf8f3';
const DISC_COLOR = '#ff4d6d';
const WEDGE_COLOR = 'rgba(255, 255, 255, 0.42)';
const NEEDLE_COLOR = '#2d4bff';

// SVG pie slice from 12 o'clock, clockwise, to `degrees`
function wedgePath(degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0), MAX_WEDGE_DEGREES);
    const radians = (clamped * Math.PI) / 180;
    const end_x = CENTER + WEDGE_RADIUS * Math.sin(radians);
    const end_y = CENTER - WEDGE_RADIUS * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - WEDGE_RADIUS} `
        + `A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large_arc} 1 ${end_x} ${end_y} Z`;
}

function tickLine(index: number): { x1: number; y1: number; x2: number; y2: number; is_major: boolean }
{
    const is_major = index % 5 === 0;
    const radians = (index * 6 * Math.PI) / 180;
    const inner = is_major ? TICK_INNER_MAJOR : TICK_INNER_MINOR;
    return {
        x1: CENTER + inner * Math.sin(radians),
        y1: CENTER - inner * Math.cos(radians),
        x2: CENTER + TICK_OUTER * Math.sin(radians),
        y2: CENTER - TICK_OUTER * Math.cos(radians),
        is_major,
    };
}

const TICKS = Array.from({ length: TICK_COUNT }, (_, index) => tickLine(index));

interface TimerDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function TimerDial(props: TimerDialProps)
{
    const wedge_d = useTransform(props.sweep_degrees, wedgePath);

    return (
        <div className={`${styles.dial} sk-no-shadow`}>
            {/* 1. Paper: face + disc (static) */}
            <svg className={styles.layer} viewBox="0 0 200 200" aria-hidden="true">
                {/* Hatched "shadow" only drawn in the sketch theme */}
                <circle className="sk-only" cx={CENTER + 5} cy={CENTER + 6} r={FACE_RADIUS} fill="url(#sketch-hatch)" />
                <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill={FACE_COLOR} filter={PAPER_LIFT_FILTER} />
                <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} fill={DISC_COLOR} filter={PAPER_LIFT_FILTER} />
            </svg>

            {/* 2. Wedge: the only part that redraws while the dial turns */}
            <svg className={styles.layer} viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                    <clipPath id="dial-disc-clip">
                        <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} />
                    </clipPath>
                </defs>
                <motion.path d={wedge_d} fill={WEDGE_COLOR} clipPath="url(#dial-disc-clip)" />
            </svg>

            {/* 3. Ink: outlines + ticks (static) */}
            <svg className={styles.layer} viewBox="0 0 200 200" aria-hidden="true">
                <g filter={INK_ROUGH_FILTER} stroke={INK_COLOR} strokeLinecap="round" fill="none">
                    <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} strokeWidth={3} />
                    <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} strokeWidth={2.4} />
                    <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - DISC_RADIUS} strokeWidth={1.4} />
                    {TICKS.map((tick, index) => (
                        <line
                            key={index}
                            x1={tick.x1}
                            y1={tick.y1}
                            x2={tick.x2}
                            y2={tick.y2}
                            strokeWidth={tick.is_major ? 3 : 1.3}
                            opacity={tick.is_major ? 1 : 0.55}
                        />
                    ))}
                </g>
            </svg>

            {/* 4. Needle: drawn once, turned by the GPU */}
            <motion.div className={styles.layer} style={{ rotate: props.sweep_degrees }}>
                <svg className={styles.layer} viewBox="0 0 200 200" aria-hidden="true">
                    <rect
                        x={CENTER - NEEDLE_WIDTH / 2}
                        y={NEEDLE_TOP}
                        width={NEEDLE_WIDTH}
                        height={CENTER - NEEDLE_TOP + 4}
                        rx={NEEDLE_WIDTH / 2}
                        fill={NEEDLE_COLOR}
                        stroke={INK_COLOR}
                        strokeWidth={2.2}
                        filter={PAPER_LIFT_FILTER}
                    />
                </svg>
            </motion.div>

            {/* 5. Hub on top (static) */}
            <svg className={styles.layer} viewBox="0 0 200 200" aria-hidden="true">
                <circle cx={CENTER} cy={CENTER} r={HUB_RADIUS} fill={NEEDLE_COLOR} stroke={INK_COLOR} strokeWidth={2.4} filter={PAPER_LIFT_FILTER} />
                <circle cx={CENTER - 4} cy={CENTER - 4} r={3} fill="#ffffff" opacity={0.7} />
            </svg>
        </div>
    );
}
