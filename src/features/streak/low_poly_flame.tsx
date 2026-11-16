import { motion } from 'motion/react';
import { FLAME_PALETTES } from './flame_palettes';
import styles from './low_poly_flame.module.css';

// A faceted "low-poly" flame drawn with SVG triangles.
// Light comes from the upper left, so each facet uses one of 4 shades.
// On mount (or when the tier changes) the facets fly in and assemble.

type Point = [number, number];

interface Facet
{
    points: [Point, Point, Point];
    shade: 0 | 1 | 2 | 3 | 'core_dark' | 'core_light';
}

// Outline + inner vertices of the flame (viewBox 0 0 200 260)
const TIP: Point = [104, 8];
const RIGHT_UPPER: Point = [130, 62];
const RIGHT_MID: Point = [157, 118];
const RIGHT_WIDE: Point = [167, 170];
const RIGHT_LOW: Point = [150, 222];
const BOTTOM: Point = [100, 250];
const LEFT_LOW: Point = [50, 222];
const LEFT_WIDE: Point = [33, 170];
const LEFT_MID: Point = [47, 122];
const TONGUE_BASE: Point = [70, 86];
const TONGUE_TIP: Point = [60, 40];
const NOTCH: Point = [84, 94];
const IN_TOP: Point = [103, 70];
const IN_CENTER: Point = [100, 122];
const IN_RIGHT: Point = [127, 152];
const IN_LEFT: Point = [73, 157];
const IN_LOW: Point = [100, 192];

// Hot core vertices
const CORE_TIP: Point = [100, 132];
const CORE_RIGHT: Point = [123, 184];
const CORE_LOW_RIGHT: Point = [115, 230];
const CORE_LOW_LEFT: Point = [85, 230];
const CORE_LEFT: Point = [77, 184];
const CORE_MID: Point = [100, 196];

const FACETS: Facet[] = [
    { points: [TIP, RIGHT_UPPER, IN_TOP], shade: 1 },
    { points: [TIP, IN_TOP, NOTCH], shade: 3 },
    { points: [RIGHT_UPPER, RIGHT_MID, IN_RIGHT], shade: 0 },
    { points: [RIGHT_UPPER, IN_RIGHT, IN_CENTER], shade: 1 },
    { points: [RIGHT_UPPER, IN_CENTER, IN_TOP], shade: 2 },
    { points: [IN_TOP, IN_CENTER, NOTCH], shade: 2 },
    { points: [NOTCH, IN_CENTER, IN_LEFT], shade: 3 },
    { points: [NOTCH, IN_LEFT, LEFT_MID], shade: 3 },
    { points: [NOTCH, TONGUE_BASE, LEFT_MID], shade: 2 },
    { points: [TONGUE_BASE, TONGUE_TIP, NOTCH], shade: 3 },
    { points: [RIGHT_MID, RIGHT_WIDE, IN_RIGHT], shade: 0 },
    { points: [RIGHT_WIDE, RIGHT_LOW, IN_LOW], shade: 0 },
    { points: [RIGHT_WIDE, IN_LOW, IN_RIGHT], shade: 1 },
    { points: [IN_RIGHT, IN_LOW, IN_CENTER], shade: 1 },
    { points: [IN_CENTER, IN_LOW, IN_LEFT], shade: 2 },
    { points: [LEFT_MID, IN_LEFT, LEFT_WIDE], shade: 2 },
    { points: [LEFT_WIDE, IN_LEFT, LEFT_LOW], shade: 2 },
    { points: [IN_LEFT, IN_LOW, LEFT_LOW], shade: 1 },
    { points: [LEFT_LOW, IN_LOW, BOTTOM], shade: 1 },
    { points: [BOTTOM, IN_LOW, RIGHT_LOW], shade: 0 },
    { points: [CORE_TIP, CORE_RIGHT, CORE_MID], shade: 'core_dark' },
    { points: [CORE_TIP, CORE_MID, CORE_LEFT], shade: 'core_light' },
    { points: [CORE_LEFT, CORE_MID, CORE_LOW_LEFT], shade: 'core_light' },
    { points: [CORE_MID, CORE_LOW_RIGHT, CORE_LOW_LEFT], shade: 'core_dark' },
    { points: [CORE_RIGHT, CORE_LOW_RIGHT, CORE_MID], shade: 'core_dark' },
];

// Floating shards around the flame: [x%, y%, size px, rotation deg]
const SHARDS: [number, number, number, number][] = [
    [12, 30, 14, 20], [84, 22, 10, -30], [20, 68, 9, 60], [88, 60, 13, 10],
    [6, 50, 7, -45], [74, 8, 8, 75], [30, 12, 6, -15], [94, 82, 8, 40],
];

const GALAXY_STARS: Point[] = [[86, 150], [118, 104], [96, 210], [132, 196], [70, 190], [110, 160]];

const ASSEMBLE_SCATTER = 70;          // px a facet starts away from its spot
const ASSEMBLE_STAGGER = 0.025;       // seconds between facets
const SWAY_DURATION = 3.2;            // seconds per sway loop

function pointsToString(points: Point[]): string
{
    return points.map(([x, y]) => `${x},${y}`).join(' ');
}

// Deterministic pseudo-random in [-1, 1] so scatter is stable between renders
function scatter(seed: number): number
{
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

interface LowPolyFlameProps
{
    tier_index: number;
    size?: number;     // rendered width in px; omit to size from the --flame-size CSS variable
}

export function LowPolyFlame(props: LowPolyFlameProps)
{
    const palette = FLAME_PALETTES[props.tier_index] ?? FLAME_PALETTES[0];

    function fillFor(shade: Facet['shade']): string
    {
        if (shade === 'core_dark')
        {
            return palette.core[0];
        }
        if (shade === 'core_light')
        {
            return palette.core[1];
        }
        return palette.shades[shade];
    }

    const flame_class = palette.effect === 'rainbow' ? `${styles.flame} ${styles.rainbow}` : styles.flame;

    return (
        <div className={styles.stage} style={props.size ? { width: props.size, height: props.size * 1.3 } : undefined}>
            <motion.div
                className={styles.glow}
                style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 65%)` }}
                animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {SHARDS.map(([left, top, size, rotation], index) => (
                <motion.span
                    key={index}
                    className={styles.shard}
                    style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: size,
                        height: size,
                        background: palette.shard_colors[index % palette.shard_colors.length],
                        rotate: rotation,
                    }}
                    animate={{ y: [0, -14, 0], rotate: [rotation, rotation + 40, rotation] }}
                    transition={{ duration: 4 + index * 0.6, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            <div className={styles.ground} />

            <svg key={props.tier_index} className={flame_class} viewBox="0 0 200 260" aria-hidden="true">
                <motion.g
                    style={{ originX: 0.5, originY: 1, transformBox: 'fill-box' }}
                    animate={{ skewX: [0, -2.5, 1.5, -1, 0], scaleY: [1, 1.035, 0.985, 1.02, 1] }}
                    transition={{ duration: SWAY_DURATION, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {FACETS.map((facet, index) => (
                        <motion.polygon
                            key={index}
                            points={pointsToString(facet.points)}
                            fill={fillFor(facet.shade)}
                            stroke={fillFor(facet.shade)}
                            strokeWidth={0.8}
                            strokeLinejoin="round"
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                            initial={{
                                opacity: 0,
                                x: scatter(index + 1) * ASSEMBLE_SCATTER,
                                y: scatter(index + 31) * ASSEMBLE_SCATTER,
                                rotate: scatter(index + 61) * 90,
                                scale: 0.4,
                            }}
                            animate={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * ASSEMBLE_STAGGER }}
                        />
                    ))}

                    {palette.effect === 'galaxy' && GALAXY_STARS.map(([x, y], index) => (
                        <motion.circle
                            key={`star-${index}`}
                            cx={x}
                            cy={y}
                            r={1.8}
                            fill="#ffffff"
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ duration: 1.6 + index * 0.3, repeat: Infinity }}
                        />
                    ))}
                </motion.g>
            </svg>
        </div>
    );
}
