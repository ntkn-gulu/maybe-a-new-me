import { motion, useTransform, type MotionValue } from 'motion/react';
import { arcPath, useDialMinutes } from './skin_dial';
import styles from './skin_dial.module.css';

// "Neon" timer skin (3D only): a neon sign on a dark board. A pink tube
// ring lights up from 12 o'clock to the session length (the rest of the
// tube stays dark glass) and the minutes glow in cyan. Each glowing line is
// drawn three times (wide faint, medium, thin bright core) instead of an
// SVG filter. viewBox 0 0 200 200.

const CENTER = 100;
const RING_RADIUS = 66;
const PINK = '#ff3fa4';
const CYAN = '#3cf0ff';

// Wide faint glow, the colored tube, the hot core
const GLOW_LAYERS = [
    { width: 16, opacity: 0.16 },
    { width: 7, opacity: 0.6 },
];

interface NeonDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function NeonDial(props: NeonDialProps)
{
    const minutes = Math.min(Math.max(useDialMinutes(props.sweep_degrees), 0), 99);
    const arc_d = useTransform(props.sweep_degrees, (degrees) => arcPath(CENTER, RING_RADIUS, degrees));
    const number_props = {
        x: CENTER,
        y: 116,
        textAnchor: 'middle' as const,
        fontFamily: 'var(--font-display)',
        fontSize: 52,
        fontWeight: 700,
        fill: 'none',
        strokeLinejoin: 'round' as const,
    };

    return (
        <div className={styles.dial}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
                {/* The board with its thickness, a faint lit edge and four screws */}
                <rect x="6" y="16" width="188" height="180" rx="30" fill="#0c0912" />
                <rect x="6" y="6" width="188" height="180" rx="30" fill="#1b1426" />
                <rect x="20" y="10" width="160" height="2.5" rx="1.25" fill="#ffffff" opacity="0.1" />
                {[[24, 24], [176, 24], [24, 168], [176, 168]].map(([x, y]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="3.2" fill="#3a2e4a" />
                ))}

                {/* Pink light washing over the board behind the tube */}
                <circle cx={CENTER} cy={CENTER - 4} r={RING_RADIUS + 14} fill={PINK} opacity="0.07" />

                <g transform="translate(0 -4)">
                    {/* The unlit glass tube */}
                    <circle cx={CENTER} cy={CENTER} r={RING_RADIUS} fill="none" stroke={PINK} strokeWidth="5" opacity="0.14" />

                    {/* The lit part of the tube */}
                    {GLOW_LAYERS.map((layer) => (
                        <motion.path key={layer.width} d={arc_d} fill="none" stroke={PINK} strokeWidth={layer.width} strokeLinecap="round" opacity={layer.opacity} />
                    ))}
                    <motion.path d={arc_d} fill="none" stroke="#ffd6ec" strokeWidth="2.4" strokeLinecap="round" />

                    {/* Minutes in cyan glass */}
                    <text {...number_props} stroke={CYAN} strokeWidth="10" opacity="0.16">{minutes}</text>
                    <text {...number_props} stroke={CYAN} strokeWidth="4.5" opacity="0.6">{minutes}</text>
                    <text {...number_props} stroke="#dcfdff" strokeWidth="1.6">{minutes}</text>
                    <text x={CENTER} y="138" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="700" letterSpacing="3" fill={CYAN} opacity="0.7">MIN</text>
                </g>
            </svg>
        </div>
    );
}
