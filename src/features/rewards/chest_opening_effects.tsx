import { motion } from 'motion/react';
import { createRandom } from '../../ui/sketch_draw';
import type { Rarity } from '../../core/types';
import styles from './chest_opening.module.css';

// The light show around a chest opening: cracks that leak light, the
// sunburst behind the item and the sparks that fly out of a burst.
// Plain vector shapes moved with transform/opacity only (no SVG filters).

export const RARITY_COLORS: Record<Rarity, string> = { common: '#b9b2a6', rare: '#2d9bff', epic: '#9a5bff', legendary: '#ffb400' };

const RAY_COUNT = 16;
const SPARK_COUNT: Record<Rarity, number> = { common: 8, rare: 12, epic: 16, legendary: 24 };

// Cracks on the chest (chest viewBox 0 0 200 180), one more per tap
export const CRACKS = [
    'M78 104 L85 117 L80 127 L89 140 L85 158',
    'M66 92 L54 100 L47 114 L36 120 M64 80 L58 70 L62 62 L54 57',
    'M90 90 L104 99 L113 94 L126 106 M144 86 L152 100 L147 114 L156 128',
];

interface CracksProps
{
    count: number;
    color: string;
    is_sketch: boolean;
    is_glowing: boolean;              // legendary build-up: the light gets stronger
}

// Cracks over the chest art: a wide stroke of the rarity color (light leaking
// out) under a thin dark line, each drawn in when it appears
export function Cracks(props: CracksProps)
{
    return (
        <svg className={styles.cracks} viewBox="0 0 200 180" aria-hidden="true">
            {CRACKS.slice(0, props.count).map((d) => (
                <g key={d}>
                    <motion.path
                        d={d}
                        stroke={props.color}
                        strokeWidth={props.is_glowing ? 11 : 7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0.4 }}
                        animate={{ pathLength: 1, opacity: props.is_glowing ? [0.6, 1, 0.6] : 0.65 }}
                        transition={{ pathLength: { duration: 0.18 }, opacity: props.is_glowing ? { duration: 0.4, repeat: Infinity } : { duration: 0.2 } }}
                    />
                    <motion.path
                        d={d}
                        stroke={props.is_sketch ? '#1f1c18' : '#3b2508'}
                        strokeWidth={props.is_sketch ? 2.6 : 2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.18 }}
                    />
                </g>
            ))}
        </svg>
    );
}

interface RaysProps
{
    color: string;
    is_sketch: boolean;
}

// Sunburst: solid wedges in the 3D theme, loose marker strokes in the sketch theme
export function Rays(props: RaysProps)
{
    const rays = Array.from({ length: RAY_COUNT }, (_, index) => (index / RAY_COUNT) * Math.PI * 2);
    return (
        <svg className={styles.rays} viewBox="-100 -100 200 200" aria-hidden="true">
            {props.is_sketch
                ? rays.map((angle, index) => (
                    <path
                        key={index}
                        d={`M${(Math.cos(angle) * 30).toFixed(1)} ${(Math.sin(angle) * 30).toFixed(1)} L${(Math.cos(angle + 0.03) * (78 + (index % 3) * 8)).toFixed(1)} ${(Math.sin(angle + 0.03) * (78 + (index % 3) * 8)).toFixed(1)}`}
                        stroke={props.color}
                        strokeWidth={index % 2 === 0 ? 1.5 : 0.9}
                        strokeLinecap="round"
                        opacity={0.6}
                    />
                ))
                : rays.map((angle, index) => (
                    <path
                        key={index}
                        d={`M0 0 L${(Math.cos(angle - 0.09) * 100).toFixed(1)} ${(Math.sin(angle - 0.09) * 100).toFixed(1)} L${(Math.cos(angle + 0.09) * 100).toFixed(1)} ${(Math.sin(angle + 0.09) * 100).toFixed(1)} Z`}
                        fill={props.color}
                        opacity={0.22}
                    />
                ))}
        </svg>
    );
}

interface Spark
{
    angle: number;
    distance: number;
    size: number;
    spin: number;
    delay: number;
}

function buildSparks(count: number, seed: number): Spark[]
{
    const random = createRandom(seed);
    return Array.from({ length: count }, (_, index) => ({
        angle: (index / count) * Math.PI * 2 + (random() - 0.5) * 0.5,
        distance: 110 + random() * 90,
        size: 8 + random() * 10,
        spin: (random() - 0.5) * 540,
        delay: random() * 0.08,
    }));
}

interface SparkBurstProps
{
    rarity: Rarity;
    seed: number;                     // a different seed per burst, so no two look the same
    is_sketch: boolean;
}

// Sparks flying out from the middle of the stage; mount it again (new key) for another burst
export function SparkBurst(props: SparkBurstProps)
{
    const sparks = buildSparks(SPARK_COUNT[props.rarity], props.seed);
    const color = RARITY_COLORS[props.rarity];
    return (
        <>
            {sparks.map((spark, index) => (
                <motion.svg
                    key={index}
                    className={styles.spark}
                    viewBox="0 0 20 20"
                    style={{ width: spark.size, height: spark.size, marginLeft: -spark.size / 2, marginTop: -spark.size / 2 }}
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
                    animate={{
                        x: Math.cos(spark.angle) * spark.distance,
                        y: Math.sin(spark.angle) * spark.distance + 40,
                        rotate: spark.spin,
                        opacity: 0,
                        scale: 1,
                    }}
                    transition={{ duration: 1.1, delay: spark.delay, ease: 'easeOut' }}
                    aria-hidden="true"
                >
                    {props.is_sketch
                        ? <path d="M10 1 L12 8 L19 10 L12 12 L10 19 L8 12 L1 10 L8 8 Z" fill={color} stroke="#1f1c18" strokeWidth={1.4} strokeLinejoin="round" />
                        : <rect x="4" y="4" width="12" height="12" rx="2" fill={index % 3 === 0 ? '#ffffff' : color} />}
                </motion.svg>
            ))}
        </>
    );
}
