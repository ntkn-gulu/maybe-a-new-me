import { motion, type MotionValue } from 'motion/react';
import styles from './record_deck.module.css';

// The 3D theme's record player, seen from above: an extruded plinth, a
// black record with grooves and an accent label, and a tonearm that swings
// onto the record when playing starts. The record turns (rotation from
// useSpin); the light on the vinyl stays put, which is what makes it look
// like it spins. Flat shapes only, no filters or gradients.

interface ExtrudedTurntableProps
{
    rotate: MotionValue<number>;
    is_arm_down: boolean;
    is_powered: boolean;
}

const RECORD_CENTER = { x: 100, y: 94 };
const GROOVE_RADII = [66, 59, 52, 45, 38];

// Arcs of reflected light on the vinyl, from start to end angle (degrees)
function sheenArc(radius: number, from: number, to: number): string
{
    const point = (degrees: number): string =>
    {
        const angle = (degrees * Math.PI) / 180;
        return `${RECORD_CENTER.x + radius * Math.cos(angle)} ${RECORD_CENTER.y + radius * Math.sin(angle)}`;
    };
    return `M${point(from)} A${radius} ${radius} 0 0 1 ${point(to)}`;
}

export function ExtrudedTurntable(props: ExtrudedTurntableProps)
{
    return (
        <svg className={styles.art} viewBox="0 0 240 196" aria-hidden="true">
            {/* Plinth: side band under the top face */}
            <rect x="12" y="20" width="216" height="168" rx="22" fill="var(--btn-neutral-side)" />
            <rect x="12" y="8" width="216" height="168" rx="22" fill="var(--btn-neutral-face)" />
            <rect x="12" y="8" width="216" height="168" rx="22" fill="none" stroke="var(--tile-stroke)" strokeWidth="1.5" />

            {/* Platter rim and the record on it */}
            <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y + 3} r="77" fill="rgba(0, 0, 0, 0.12)" />
            <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r="77" fill="#3b3b3b" />
            <motion.g style={{ rotate: props.rotate }}>
                <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r="72" fill="#151515" />
                {GROOVE_RADII.map((radius) => (
                    <circle key={radius} cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r={radius} fill="none" stroke="#2a2a2a" strokeWidth="1.3" />
                ))}
                <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r="25" fill="var(--color-accent)" />
                <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r="25" fill="none" stroke="var(--color-accent-side)" strokeWidth="2" />
                <path d={`M${RECORD_CENTER.x - 15} ${RECORD_CENTER.y - 9} h30`} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
                <path d={`M${RECORD_CENTER.x - 9} ${RECORD_CENTER.y + 10} h18`} stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
            </motion.g>
            <circle cx={RECORD_CENTER.x} cy={RECORD_CENTER.y} r="3.2" fill="#e8e8e8" />
            <path d={sheenArc(60, 200, 245)} stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.1" />
            <path d={sheenArc(48, 20, 60)} stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.08" />

            {/* Power light and speed keys */}
            <circle cx="30" cy="160" r="4.5" fill={props.is_powered ? 'var(--color-accent)' : '#8c8478'} />
            <rect x="196" y="150" width="18" height="10" rx="4" fill="var(--btn-neutral-side)" />
            <rect x="174" y="150" width="18" height="10" rx="4" fill="var(--btn-neutral-side)" />

            {/* Tonearm: pivot top right; it swings onto the outer grooves when playing */}
            <circle cx="196" cy="40" r="15" fill="var(--btn-neutral-side)" />
            <g className={props.is_arm_down ? `${styles.arm} ${styles.arm_down}` : styles.arm}>
                <rect x="190" y="16" width="12" height="13" rx="3" fill="#2a2a2a" />
                <path d="M196 40 L196 132" stroke="#c9c9c9" strokeWidth="5" strokeLinecap="round" />
                <path d="M196 40 L196 132" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <rect x="189" y="128" width="14" height="20" rx="3.5" fill="#2a2a2a" />
            </g>
            <circle cx="196" cy="40" r="7.5" fill="#2a2a2a" />
            <circle cx="196" cy="40" r="2.5" fill="#8c8c8c" />
        </svg>
    );
}
