import { motion } from 'motion/react';
import styles from './shattered_dial.module.css';

// The Focus dial breaking apart: the pink disc splits into thick shards
// along jagged cracks, they burst out and drop a little, the needle snaps off.
// Geometry is computed once; shards share their crack edges exactly, so the
// disc looks whole at the first frame.

type Point = [number, number];

const CENTER: Point = [120, 116];
const DISC_RADIUS = 70;
const RING_RADIUS = 100;
const CRACK_ORIGIN: Point = [126, 108];           // cracks start slightly off-center
const SHARD_THICKNESS = 7;                         // px of visible "side" under each shard

// Crack angles in degrees, clockwise from 12 o'clock
const CRACK_ANGLES = [0, 48, 101, 152, 205, 258, 312];
// Each crack bends once halfway out: [radius of the bend, angle offset]
const CRACK_BENDS: [number, number][] = [[34, 9], [30, -10], [38, 7], [32, -8], [36, 10], [30, -6], [35, 8]];

const SHARD_FACES = ['#ff4d6d', '#ff6b85', '#e83e5e', '#ff7f96', '#f2456a', '#ff5d7a', '#e54a68'];
const SHARD_SIDE = '#b8213f';

// How far each shard flies: [distance px, extra drop px, rotation deg]
const SHARD_FLIGHT: [number, number, number][] = [[16, 6, -10], [20, 10, 14], [14, 18, -8], [18, 22, 12], [12, 20, -16], [22, 12, 9], [15, 4, -12]];

// Little debris triangles: [angle deg, distance px, size px]
const DEBRIS: [number, number, number][] = [[20, 92, 7], [80, 98, 5], [140, 90, 6], [200, 100, 8], [260, 94, 5], [320, 96, 6]];

const ARC_STEP_DEGREES = 8;

function polar(angle_degrees: number, radius: number, origin: Point = CENTER): Point
{
    const radians = (angle_degrees * Math.PI) / 180;
    return [origin[0] + radius * Math.sin(radians), origin[1] - radius * Math.cos(radians)];
}

function toPoints(points: Point[]): string
{
    return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

interface Shard
{
    points: Point[];
    direction: Point;      // unit vector from the crack origin toward the shard
}

function buildShards(): Shard[]
{
    // crack i: origin -> bend -> rim
    const cracks: Point[][] = CRACK_ANGLES.map((angle, index) =>
    {
        const [bend_radius, bend_offset] = CRACK_BENDS[index];
        return [CRACK_ORIGIN, polar(angle + bend_offset, bend_radius), polar(angle, DISC_RADIUS)];
    });

    return CRACK_ANGLES.map((start_angle, index) =>
    {
        const end_angle = CRACK_ANGLES[index + 1] ?? 360;
        const arc: Point[] = [];
        for (let angle = start_angle + ARC_STEP_DEGREES; angle < end_angle; angle += ARC_STEP_DEGREES)
        {
            arc.push(polar(angle, DISC_RADIUS));
        }
        const next_crack = cracks[(index + 1) % cracks.length];
        const points = [...cracks[index], ...arc, ...[...next_crack].reverse().slice(0, -1)];

        const middle = polar((start_angle + end_angle) / 2, DISC_RADIUS / 2);
        const dx = middle[0] - CRACK_ORIGIN[0];
        const dy = middle[1] - CRACK_ORIGIN[1];
        const length = Math.hypot(dx, dy) || 1;
        return { points, direction: [dx / length, dy / length] };
    });
}

const SHARDS = buildShards();
const TICKS = Array.from({ length: 12 }, (_, index) => index * 30);

export function ShatteredDial()
{
    return (
        <motion.svg
            className={styles.dial}
            viewBox="0 0 240 250"
            aria-hidden="true"
            // A short shudder before it breaks
            animate={{ x: [0, -5, 5, -3, 3, 0] }}
            transition={{ duration: 0.3 }}
        >
            <ellipse cx="120" cy="236" rx="78" ry="9" className={styles.shadow} />

            {/* Cream ring with thickness and ticks (stays intact) */}
            <circle cx={CENTER[0]} cy={CENTER[1] + 10} r={RING_RADIUS} fill="var(--tile-side)" />
            <circle cx={CENTER[0]} cy={CENTER[1]} r={RING_RADIUS} fill="var(--tile-face)" />
            {TICKS.map((angle) =>
            {
                const [x1, y1] = polar(angle, RING_RADIUS - 6);
                const [x2, y2] = polar(angle, RING_RADIUS - (angle % 90 === 0 ? 16 : 12));
                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.tick} />;
            })}
            {/* Empty socket where the disc was */}
            <circle cx={CENTER[0]} cy={CENTER[1]} r={DISC_RADIUS} fill="var(--color-bg-deep)" />

            {SHARDS.map((shard, index) =>
            {
                const [distance, drop, rotation] = SHARD_FLIGHT[index];
                return (
                    <motion.g
                        key={index}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        initial={{ x: 0, y: 0, rotate: 0 }}
                        animate={{ x: shard.direction[0] * distance, y: shard.direction[1] * distance + drop, rotate: rotation }}
                        transition={{ type: 'spring', stiffness: 140, damping: 11, delay: 0.28 + index * 0.025 }}
                    >
                        <polygon points={toPoints(shard.points.map(([x, y]) => [x, y + SHARD_THICKNESS]))} fill={SHARD_SIDE} />
                        <polygon points={toPoints(shard.points)} fill={SHARD_FACES[index]} stroke={SHARD_FACES[index]} strokeWidth="0.6" strokeLinejoin="round" />
                    </motion.g>
                );
            })}

            {/* Needle snaps and falls */}
            <motion.g
                initial={{ rotate: -40, y: 0 }}
                animate={{ rotate: 125, y: 34 }}
                transition={{ type: 'spring', stiffness: 90, damping: 9, delay: 0.32 }}
            >
                {/* Invisible circle centered on the hub: makes the group's box centered
                    there, so Motion's default (box-center) rotation turns around the hub */}
                <circle cx={CENTER[0]} cy={CENTER[1]} r="56" fill="none" />
                <rect x={CENTER[0] - 5} y={CENTER[1] - 54} width="10" height="50" rx="5" className={styles.needle} />
                <circle cx={CENTER[0]} cy={CENTER[1]} r="13" className={styles.needle} />
            </motion.g>

            {DEBRIS.map(([angle, distance, size], index) =>
            {
                const [x, y] = polar(angle, 24, CRACK_ORIGIN);
                const [to_x, to_y] = polar(angle, distance, CRACK_ORIGIN);
                return (
                    <motion.polygon
                        key={`debris-${index}`}
                        points={toPoints([[x, y - size], [x + size, y + size], [x - size, y + size]])}
                        fill={SHARD_FACES[index]}
                        initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                        animate={{ x: to_x - x, y: to_y - y + 20, opacity: [0, 1, 1, 0], rotate: 180 }}
                        transition={{ duration: 0.9, delay: 0.28, ease: 'easeOut' }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                );
            })}
        </motion.svg>
    );
}
