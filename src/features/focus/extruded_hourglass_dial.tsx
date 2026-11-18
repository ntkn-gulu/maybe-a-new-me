import { useId } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { GLASS_PATH, PLATE_BOTTOM, PLATE_TOP, POSTS, SAND_BOTTOM_Y, TOP_BULB_PATH, useSandLevel } from './hourglass_shape';
import styles from './skin_dial.module.css';

// "Hourglass" timer skin, 3D version: a wooden frame with thick plates and
// round posts around a glass hourglass. The sand in the top bulb rises to
// the session length (a rect clipped to the bulb, so only its y changes).

const WOOD = '#c08447';
const WOOD_SIDE = '#8e5a2b';
const SAND = '#eab54c';
const SAND_SHADE = '#cf9532';

function Plate(props: { box: [number, number, number, number] })
{
    const [x, y, width, height] = props.box;
    return (
        <g>
            <rect x={x} y={y + 6} width={width} height={height} rx="6" fill={WOOD_SIDE} />
            <rect x={x} y={y} width={width} height={height} rx="6" fill={WOOD} />
            <rect x={x + 8} y={y + 3} width={width - 16} height="2.5" rx="1.25" fill="#ffffff" opacity="0.3" />
        </g>
    );
}

interface ExtrudedHourglassDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function ExtrudedHourglassDial(props: ExtrudedHourglassDialProps)
{
    const clip_id = useId();
    const sand_y = useSandLevel(props.sweep_degrees);
    const sand_height = useTransform(sand_y, (y) => SAND_BOTTOM_Y - y);

    return (
        <div className={styles.dial}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                    <clipPath id={clip_id}>
                        <path d={TOP_BULB_PATH} />
                    </clipPath>
                </defs>

                {/* Soft contact shadow on the paper */}
                <ellipse cx="100" cy="190" rx="70" ry="6" fill="rgba(60, 45, 25, 0.16)" />

                {/* Posts behind the glass */}
                {POSTS.map(([x, y, width, height]) => (
                    <g key={x}>
                        <rect x={x} y={y} width={width} height={height} rx="4" fill={WOOD_SIDE} />
                        <rect x={x} y={y} width={width - 3} height={height} rx="4" fill={WOOD} />
                    </g>
                ))}

                {/* Glass, then the sand inside the top bulb (a darker band on the right side) */}
                <path d={GLASS_PATH} fill="rgba(255, 255, 255, 0.45)" />
                <g clipPath={`url(#${clip_id})`}>
                    <motion.rect x="60" width="80" y={sand_y} height={sand_height} fill={SAND} />
                    <motion.rect x="112" width="30" y={sand_y} height={sand_height} fill={SAND_SHADE} />
                </g>
                {/* A little cone of sand already waiting in the bottom bulb */}
                <path d="M88 164 C92 156 97 153 100 153 C103 153 108 156 112 164 Z" fill={SAND} />
                <path d={GLASS_PATH} fill="none" stroke="rgba(20, 20, 20, 0.22)" strokeWidth="2" />
                <path d="M70 44 C70 64 84 80 93 92" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.7" />
                <path d="M70 156 C70 140 82 124 90 116" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />

                <Plate box={PLATE_TOP} />
                <Plate box={PLATE_BOTTOM} />
            </svg>
        </div>
    );
}
