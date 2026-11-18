import type { MotionValue } from 'motion/react';
import { useDialMinutes } from './skin_dial';
import styles from './skin_dial.module.css';

// "Retro LCD" timer skin (3D only): a chunky plastic gadget with a green
// LCD. A ring of 60 segments lights up to the session length and two
// 7-segment digits show the minutes. Unlit segments stay faintly visible,
// like on a real LCD. Plain polygons (viewBox 0 0 200 200).

const CENTER = 100;
const SEGMENT_COUNT = 60;
const RING_INNER = 50;
const RING_OUTER = 60;
const LCD_INK = '#1f2a17';
const LIT_OPACITY = 0.86;
const GHOST_OPACITY = 0.1;

// One wedge-shaped ring segment, a hair narrower than its 6° slot
function ringSegment(index: number): string
{
    const half_width = (2.2 * Math.PI) / 180;
    const angle = (index * 6 + 3) * (Math.PI / 180);
    const corner = (radius: number, offset: number): string =>
        `${(CENTER + radius * Math.sin(angle + offset)).toFixed(2)},${(CENTER - radius * Math.cos(angle + offset)).toFixed(2)}`;
    return [corner(RING_INNER, -half_width), corner(RING_OUTER, -half_width), corner(RING_OUTER, half_width), corner(RING_INNER, half_width)].join(' ');
}

const RING_SEGMENTS = Array.from({ length: SEGMENT_COUNT }, (_, index) => ringSegment(index));

// ---------- 7-segment digits ----------

type Segment = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

const DIGIT_SEGMENTS: Record<number, Segment[]> = {
    0: ['a', 'b', 'c', 'd', 'e', 'f'],
    1: ['b', 'c'],
    2: ['a', 'b', 'g', 'e', 'd'],
    3: ['a', 'b', 'g', 'c', 'd'],
    4: ['f', 'g', 'b', 'c'],
    5: ['a', 'f', 'g', 'c', 'd'],
    6: ['a', 'f', 'g', 'e', 'd', 'c'],
    7: ['a', 'b', 'c'],
    8: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    9: ['a', 'b', 'c', 'd', 'f', 'g'],
};

const ALL_SEGMENTS: Segment[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const DIGIT_WIDTH = 24;
const DIGIT_HEIGHT = 42;
const SEGMENT_THICKNESS = 5.5;
const SEGMENT_GAP = 1;

// Six-sided bars with pointed ends, the classic LCD segment shape
function horizontalBar(x1: number, x2: number, y: number): string
{
    const half = SEGMENT_THICKNESS / 2;
    return `${x1},${y} ${x1 + half},${y - half} ${x2 - half},${y - half} ${x2},${y} ${x2 - half},${y + half} ${x1 + half},${y + half}`;
}

function verticalBar(x: number, y1: number, y2: number): string
{
    const half = SEGMENT_THICKNESS / 2;
    return `${x},${y1} ${x + half},${y1 + half} ${x + half},${y2 - half} ${x},${y2} ${x - half},${y2 - half} ${x - half},${y1 + half}`;
}

function digitSegments(x: number, y: number): Record<Segment, string>
{
    const half = SEGMENT_THICKNESS / 2;
    const middle = y + DIGIT_HEIGHT / 2;
    const left = x + half;
    const right = x + DIGIT_WIDTH - half;
    return {
        a: horizontalBar(x + SEGMENT_GAP, x + DIGIT_WIDTH - SEGMENT_GAP, y + half),
        g: horizontalBar(x + SEGMENT_GAP, x + DIGIT_WIDTH - SEGMENT_GAP, middle),
        d: horizontalBar(x + SEGMENT_GAP, x + DIGIT_WIDTH - SEGMENT_GAP, y + DIGIT_HEIGHT - half),
        f: verticalBar(left, y + half + SEGMENT_GAP, middle - SEGMENT_GAP),
        b: verticalBar(right, y + half + SEGMENT_GAP, middle - SEGMENT_GAP),
        e: verticalBar(left, middle + SEGMENT_GAP, y + DIGIT_HEIGHT - half - SEGMENT_GAP),
        c: verticalBar(right, middle + SEGMENT_GAP, y + DIGIT_HEIGHT - half - SEGMENT_GAP),
    };
}

const DIGIT_TOP = 72;
const DIGIT_SLOTS = [digitSegments(CENTER - DIGIT_WIDTH - 4, DIGIT_TOP), digitSegments(CENTER + 4, DIGIT_TOP)];

function SevenSegment(props: { slot: Record<Segment, string>; digit: number })
{
    const lit = DIGIT_SEGMENTS[props.digit] ?? [];
    return (
        <g>
            {ALL_SEGMENTS.map((segment) => (
                <polygon
                    key={segment}
                    points={props.slot[segment]}
                    fill={LCD_INK}
                    opacity={lit.includes(segment) ? LIT_OPACITY : GHOST_OPACITY}
                />
            ))}
        </g>
    );
}

interface RetroLcdDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function RetroLcdDial(props: RetroLcdDialProps)
{
    const minutes = useDialMinutes(props.sweep_degrees);
    const shown = Math.min(Math.max(minutes, 0), 99);
    return (
        <div className={styles.dial}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
                {/* Plastic body with its thickness below, a lit top edge and two buttons on top */}
                <rect x="38" y="4" width="22" height="14" rx="4" fill="#5b6168" />
                <rect x="140" y="4" width="22" height="14" rx="4" fill="#d1342b" />
                <rect x="8" y="22" width="184" height="172" rx="30" fill="#24282d" />
                <rect x="8" y="12" width="184" height="172" rx="30" fill="#3d434a" />
                <rect x="20" y="16" width="160" height="3" rx="1.5" fill="#ffffff" opacity="0.14" />

                {/* The LCD panel, slightly sunken */}
                <rect x="26" y="30" width="148" height="138" rx="14" fill="#2a2e33" />
                <rect x="30" y="34" width="140" height="130" rx="11" fill="#a9bb8a" />
                <rect x="30" y="34" width="140" height="7" rx="3.5" fill="#000000" opacity="0.08" />

                {/* Session length as a lit ring of segments */}
                <g transform="translate(0 -1)">
                    {RING_SEGMENTS.map((points, index) => (
                        <polygon key={index} points={points} fill={LCD_INK} opacity={index < minutes ? LIT_OPACITY : GHOST_OPACITY} />
                    ))}
                </g>

                {/* Minutes as two slanted 7-segment digits */}
                <g transform="skewX(-6) translate(9 -8)">
                    <SevenSegment slot={DIGIT_SLOTS[0]} digit={Math.floor(shown / 10)} />
                    <SevenSegment slot={DIGIT_SLOTS[1]} digit={shown % 10} />
                </g>
                <text x="100" y="134" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fontWeight="700" letterSpacing="2" fill={LCD_INK} opacity="0.75">MIN</text>
            </svg>
        </div>
    );
}
