import { motion } from 'motion/react';
import {
    SKETCH_INK,
    createRandom,
    densifyPolygon,
    ellipsePoints,
    hatchLines,
    sketchOutline,
    type Point,
} from '../../ui/sketch_draw';
import styles from './sketch_shattered_dial.module.css';

// The sketch dial (SketchTimerDial) breaking apart: the red-hatched paper
// disc tears into shards along jagged cracks, each with a wobbly ink
// outline; they burst out and drop a little, the ink needle snaps off and
// paper scraps fly. Plain vector geometry computed once (no SVG filters):
// everything here moves, and moving filtered shapes stutter on iPhone.
// Shards share their crack edges exactly, so the disc looks whole at the first frame.

const CENTER: Point = [120, 116];
const DISC_RADIUS = 70;
const RING_RADIUS = 100;
const CRACK_ORIGIN: Point = [126, 108];           // cracks start slightly off-center
const RED_PEN = '#d1342b';
const PAPER = 'var(--tile-face, #fbf7ef)';

// Crack angles in degrees, clockwise from 12 o'clock
const CRACK_ANGLES = [0, 48, 101, 152, 205, 258, 312];
// Each crack bends once halfway out: [radius of the bend, angle offset]
const CRACK_BENDS: [number, number][] = [[34, 9], [30, -10], [38, 7], [32, -8], [36, 10], [30, -6], [35, 8]];

// How far each shard flies: [distance px, extra drop px, rotation deg]
const SHARD_FLIGHT: [number, number, number][] = [[16, 6, -10], [20, 10, 14], [14, 18, -8], [18, 22, 12], [12, 20, -16], [22, 12, 9], [15, 4, -12]];

// Little paper scraps: [angle deg, distance px, size px]
const DEBRIS: [number, number, number][] = [[20, 92, 7], [80, 98, 5], [140, 90, 6], [200, 100, 8], [260, 94, 5], [320, 96, 6]];

const ARC_STEP_DEGREES = 8;
const EDGE_STEP = 6;                  // densify shard edges so the wobble bends them

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
    hatch: string;         // red pen hatching inside the shard
    outline: string;       // wobbly ink outline
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
        return {
            points,
            direction: [dx / length, dy / length],
            hatch: hatchLines(points, { angle: 50, gap: 4.6, seed: 100 + index }),
            outline: sketchOutline(densifyPolygon(points, EDGE_STEP), 1.2, 120 + index, 2),
        };
    });
}

// Hour ticks of uneven length, like the live dial
function buildTicks(): string
{
    const random = createRandom(17);
    return Array.from({ length: 12 }, (_, index) =>
    {
        const angle = index * 30 + (random() - 0.5) * 3;
        const [x1, y1] = polar(angle, RING_RADIUS - 5 - random() * 2);
        const [x2, y2] = polar(angle, RING_RADIUS - (index % 3 === 0 ? 17 : 12) - random() * 3);
        return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }).join('');
}

const SHARDS = buildShards();
const TICKS = buildTicks();
const RING_POINTS = ellipsePoints(CENTER[0], CENTER[1], RING_RADIUS, RING_RADIUS, 60);
const RING = sketchOutline(RING_POINTS, 1.3, 21, 4);
const RING_ECHO = sketchOutline(RING_POINTS, 1.9, 22, 3);
const GROUND_HATCH = hatchLines(ellipsePoints(120, 236, 78, 9, 32), { angle: 20, gap: 3.4, seed: 23 });
const SOCKET_HATCH = hatchLines(ellipsePoints(CENTER[0], CENTER[1], DISC_RADIUS, DISC_RADIUS, 40), { angle: -40, gap: 6, seed: 25 });
const NEEDLE = `M${CENTER[0]} ${CENTER[1] - 2} Q${CENTER[0] - 1.6} ${CENTER[1] - 29} ${CENTER[0] + 0.6} ${CENTER[1] - 56}`;

export function SketchShatteredDial()
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
            <path d={GROUND_HATCH} stroke={SKETCH_INK} strokeWidth={1.1} strokeLinecap="round" opacity={0.4} />

            {/* Paper face with the ink ring and ticks (stays intact) */}
            <circle cx={CENTER[0]} cy={CENTER[1]} r={RING_RADIUS} fill={PAPER} />
            {/* Empty socket where the disc was: faint pencil hatching */}
            <path d={SOCKET_HATCH} stroke={SKETCH_INK} strokeWidth={1} strokeLinecap="round" opacity={0.18} />
            <g fill="none" stroke={SKETCH_INK} strokeLinecap="round" strokeLinejoin="round">
                <path d={RING} strokeWidth={2.8} />
                <path d={RING_ECHO} strokeWidth={1.2} opacity={0.55} />
                <circle cx={CENTER[0]} cy={CENTER[1]} r={DISC_RADIUS} strokeWidth={1.4} strokeDasharray="4 6" opacity={0.45} />
                <path d={TICKS} strokeWidth={2.6} />
            </g>

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
                        <polygon points={toPoints(shard.points)} fill={PAPER} />
                        <path d={shard.hatch} stroke={RED_PEN} strokeWidth={1.7} strokeLinecap="round" />
                        <path d={shard.outline} fill="none" stroke={SKETCH_INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
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
                <path d={NEEDLE} fill="none" stroke={SKETCH_INK} strokeWidth={5} strokeLinecap="round" />
                <circle cx={CENTER[0]} cy={CENTER[1]} r="9" fill={SKETCH_INK} />
            </motion.g>

            {DEBRIS.map(([angle, distance, size], index) =>
            {
                const [x, y] = polar(angle, 24, CRACK_ORIGIN);
                const [to_x, to_y] = polar(angle, distance, CRACK_ORIGIN);
                return (
                    <motion.polygon
                        key={`debris-${index}`}
                        points={toPoints([[x, y - size], [x + size, y + size], [x - size, y + size]])}
                        fill={index % 2 === 0 ? RED_PEN : PAPER}
                        stroke={SKETCH_INK}
                        strokeWidth={1.4}
                        strokeLinejoin="round"
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
