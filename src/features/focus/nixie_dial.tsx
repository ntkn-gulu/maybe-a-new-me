import type { MotionValue } from 'motion/react';
import { useDialMinutes } from './skin_dial';
import styles from './skin_dial.module.css';

// "Nixie" timer skin (3D only): two glass tubes on a wooden base, the
// minutes glowing in orange wire numerals. The glow is the same digit drawn
// three times (wide and faint, medium, thin and bright), not an SVG filter.
// Behind each lit digit an unlit "8" stays faintly visible, like the other
// stacked numerals inside a real tube. viewBox 0 0 200 200.

const TUBE_TOP = 26;
const TUBE_BOTTOM = 150;
const TUBE_WIDTH = 56;
const TUBE_CENTERS = [70, 130];
const DIGIT_BASELINE = 116;
const DIGIT_SIZE = 68;
const GLOW = '#ff6a00';

// A tube: straight sides with a round dome on top
function tubePath(center_x: number): string
{
    const half = TUBE_WIDTH / 2;
    const left = center_x - half;
    const right = center_x + half;
    return `M ${left} ${TUBE_BOTTOM} L ${left} ${TUBE_TOP + half} A ${half} ${half} 0 0 1 ${right} ${TUBE_TOP + half} L ${right} ${TUBE_BOTTOM} Z`;
}

function NixieTube(props: { center_x: number; digit: number })
{
    const digit_props = {
        x: props.center_x,
        y: DIGIT_BASELINE,
        textAnchor: 'middle' as const,
        fontFamily: 'var(--font-display)',
        fontSize: DIGIT_SIZE,
        fontWeight: 500,
        fill: 'none',
        strokeLinejoin: 'round' as const,
    };
    return (
        <g>
            {/* Dark inside, wire mesh, the unlit numerals */}
            <path d={tubePath(props.center_x)} fill="#2a1b14" />
            <path
                d={`M ${props.center_x - 18} 52 H ${props.center_x + 18} M ${props.center_x - 20} 70 H ${props.center_x + 20} M ${props.center_x - 20} 88 H ${props.center_x + 20} M ${props.center_x - 20} 106 H ${props.center_x + 20} M ${props.center_x - 20} 124 H ${props.center_x + 20}`}
                stroke="#6b4a3a"
                strokeWidth="0.6"
                opacity="0.5"
            />
            <text {...digit_props} stroke="#6b4a3a" strokeWidth="1.4" opacity="0.4">8</text>

            {/* The lit digit: wide faint glow, warm middle, bright core */}
            <text {...digit_props} stroke={GLOW} strokeWidth="9" opacity="0.18">{props.digit}</text>
            <text {...digit_props} stroke="#ff8a2a" strokeWidth="3.6" opacity="0.75">{props.digit}</text>
            <text {...digit_props} stroke="#ffe0b8" strokeWidth="1.3">{props.digit}</text>

            {/* Glass: outline and a long highlight on the left */}
            <path d={tubePath(props.center_x)} fill="none" stroke="#d9cbb9" strokeWidth="2.5" opacity="0.85" />
            <path d={`M ${props.center_x - 19} 140 V 54`} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.32" />
        </g>
    );
}

interface NixieDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function NixieDial(props: NixieDialProps)
{
    const minutes = Math.min(Math.max(useDialMinutes(props.sweep_degrees), 0), 99);
    return (
        <div className={styles.dial}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
                {/* Warm light spilling onto the base */}
                <ellipse cx="100" cy="152" rx="80" ry="14" fill={GLOW} opacity="0.16" />

                {TUBE_CENTERS.map((center_x, index) => (
                    <NixieTube key={center_x} center_x={center_x} digit={index === 0 ? Math.floor(minutes / 10) : minutes % 10} />
                ))}

                {/* Wooden base with its thickness, a lit edge and two metal sockets */}
                <rect x="14" y="160" width="172" height="30" rx="10" fill="#6e4429" />
                <rect x="14" y="148" width="172" height="30" rx="10" fill="#a8703f" />
                <rect x="24" y="151" width="152" height="2.5" rx="1.25" fill="#ffffff" opacity="0.25" />
                <rect x="44" y="144" width="52" height="9" rx="3" fill="#8d8a86" />
                <rect x="104" y="144" width="52" height="9" rx="3" fill="#8d8a86" />
                <circle cx="100" cy="166" r="3.5" fill="#ff8a2a" />
                <circle cx="100" cy="166" r="7" fill="#ff8a2a" opacity="0.25" />
            </svg>
        </div>
    );
}
