import { motion } from 'motion/react';
import { INK_BOIL_FILTER, PAPER_LIFT_FILTER } from '../../ui/ink_filters';
import { MYSTERY_COLORS, MYSTERY_EFFECTS, getFlameColors, getFlameEffects } from './flame_palettes';
import styles from './paper_flame.module.css';

// The flame as cut paper + hand-drawn ink, like a pop-up in a sketchbook.
// Colored paper layers (outer to core) pop up one by one, then the ink
// outline draws itself and keeps "boiling" (wobbling like hand-drawn
// animation). Only once the flame is complete do little flame-tip sparks
// start drifting up, one at a time.
// - colors: tier or equipped flame item; effects (layers, sparks, stars) follow the tier
// - is_mystery: a locked tier, blank paper with a "?"
// - is_bursting: the layers blow apart (level-up screen)

// Three-tongue flame silhouette (viewBox 0 0 200 260), base at (100, 248)
const FLAME_PATH = 'M100 12 C108 46 126 66 132 92 C140 80 146 68 146 54 C166 84 176 120 172 160 '
    + 'C168 214 136 248 100 248 C62 248 30 214 30 168 C30 130 40 100 52 62 C64 84 70 100 76 112 C74 76 84 44 100 12 Z';

// Cartoon shine along the lit (left) side of the outer layer
const SHINE_PATH = 'M46 198 C40 178 41 158 48 140';

// Little flame tip used for sparks (drawn around its own origin)
const SPARK_PATH = 'M0 0 C3 5 5 9 0 13 C-5 9 -3 5 0 0 Z';

// Where sparks start, in viewBox units (they drift up from here)
const SPARK_SPOTS: [number, number][] = [[46, 70], [156, 58], [154, 128], [40, 136], [104, 2], [174, 96]];

// Stars cut into the galaxy flame: [x, y, radius]
const STAR_SPOTS: [number, number, number][] = [[86, 156, 5], [118, 120, 4], [98, 206, 4], [130, 186, 3.5], [72, 188, 3]];

const INNERMOST_SCALE = 0.36;         // size of the core layer relative to the outer one
const LAYER_POP_START = 0.08;         // seconds before the first layer pops up
const LAYER_STAGGER = 0.12;           // seconds between layers
const INK_DRAW_SECONDS = 0.75;        // outline drawing time
const SETTLE_SECONDS = 1.55;          // flame fully drawn; sparks may start after this
const SPARK_SPAWN_GAP = 0.65;         // seconds between the first appearance of each spark
const SPARK_FLIGHT_SECONDS = 2.6;
const SPARK_RISE = 48;                // viewBox units a spark travels up
const SWAY_SECONDS = 3.4;
const BURST_SCATTER = 170;            // viewBox units a layer flies when bursting

const INK_COLOR = '#1f1c18';

function layerTransform(scale: number, offset_x: number): string
{
    return `translate(${100 + offset_x} 248) scale(${scale}) translate(-100 -248)`;
}

// Deterministic pseudo-random in [-1, 1] so scatter is stable between renders
function scatter(seed: number): number
{
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

function starPoints(x: number, y: number, radius: number): string
{
    const inner = radius * 0.3;
    return [
        [x, y - radius], [x + inner, y - inner], [x + radius, y], [x + inner, y + inner],
        [x, y + radius], [x - inner, y + inner], [x - radius, y], [x - inner, y - inner],
    ].map(([px, py]) => `${px},${py}`).join(' ');
}

interface PaperFlameProps
{
    tier_index: number;
    color_id?: string | null;     // equipped flame color item; omit to use the tier colors
    size?: number;                // rendered width in px; omit to size from the --flame-size CSS variable
    is_bursting?: boolean;        // layers blow apart and fade out
    is_mystery?: boolean;         // locked tier: blank paper, no tier effects
}

export function PaperFlame(props: PaperFlameProps)
{
    const is_mystery = props.is_mystery ?? false;
    const is_bursting = props.is_bursting ?? false;
    const colors = is_mystery ? MYSTERY_COLORS : getFlameColors(props.tier_index, props.color_id ?? null);
    const effects = is_mystery ? MYSTERY_EFFECTS : getFlameEffects(props.tier_index);

    // Outer layer uses the darkest shade, the core the lightest
    const palette = [colors.shades[0], colors.shades[1], colors.shades[2], colors.shades[3], colors.core[0], colors.core[1]];
    const layer_count = effects.layer_count;
    const layers = Array.from({ length: layer_count }, (_, index) =>
    {
        const scale = 1 - index * ((1 - INNERMOST_SCALE) / (layer_count - 1));
        const offset_x = index === 0 ? 0 : (index % 2 === 1 ? -3 : 3);   // slightly off-center, like hand-cut paper
        // Fewer layers skip middle shades, so the core stays the lightest
        const color = palette[Math.round((index / (layer_count - 1)) * (palette.length - 1))];
        return { transform: layerTransform(scale, offset_x), color };
    });
    const core_transform = layers[layers.length - 1].transform;
    const ink_delay = LAYER_POP_START;

    const flame_class = colors.is_hue_cycling ? `${styles.flame} ${styles.rainbow}` : styles.flame;
    const redraw_key = `${props.tier_index}-${props.color_id ?? ''}-${is_mystery}`;

    return (
        <div className={styles.stage} style={props.size ? { width: props.size, height: props.size * 1.3 } : undefined}>
            <motion.div
                key={`glow-${redraw_key}`}
                className={styles.glow}
                style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 65%)` }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={is_bursting
                    ? { opacity: 0, scale: 1.4 }
                    : { opacity: [0.85, 1, 0.85], scale: [1, 1 + effects.glow_pulse, 1] }}
                transition={is_bursting
                    ? { duration: 0.4 }
                    : { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />

            <div className={styles.ground} />

            <svg key={redraw_key} className={flame_class} viewBox="0 0 200 260" aria-hidden="true">
                <motion.g
                    style={{ originX: 0.5, originY: 1, transformBox: 'fill-box' }}
                    animate={{ skewX: [0, -2.4, 1.6, -1, 0], scaleY: [1, 1.03, 0.99, 1.015, 1] }}
                    transition={{ duration: SWAY_SECONDS, repeat: Infinity, ease: 'easeInOut', delay: SETTLE_SECONDS }}
                >
                    {layers.map((layer, index) => (
                        <motion.g
                            key={index}
                            style={{ originX: 0.5, originY: 1, transformBox: 'fill-box' }}
                            initial={{ scale: 0.15, rotate: -8, opacity: 0 }}
                            animate={is_bursting
                                ? {
                                    scale: 0.6,
                                    rotate: scatter(index + 3) * 120,
                                    x: scatter(index + 11) * BURST_SCATTER,
                                    y: scatter(index + 23) * BURST_SCATTER * 0.7 - 40,
                                    opacity: 0,
                                }
                                : { scale: 1, rotate: 0, x: 0, y: 0, opacity: 1 }}
                            // Springs move the paper; opacity gets a plain tween so it never bounces
                            transition={is_bursting
                                ? { type: 'spring', stiffness: 110, damping: 15, opacity: { duration: 0.5, delay: 0.12 } }
                                : {
                                    type: 'spring',
                                    stiffness: 340,
                                    damping: 17,
                                    delay: LAYER_POP_START + index * LAYER_STAGGER,
                                    opacity: { duration: 0.12, delay: LAYER_POP_START + index * LAYER_STAGGER },
                                }}
                        >
                            <path d={FLAME_PATH} transform={layer.transform} fill={layer.color} filter={PAPER_LIFT_FILTER} />
                        </motion.g>
                    ))}

                    {effects.has_stars && !is_bursting && STAR_SPOTS.map(([x, y, radius], index) => (
                        <motion.polygon
                            key={`star-${index}`}
                            points={starPoints(x, y, radius)}
                            fill="#ffffff"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.25, 1, 0.25] }}
                            transition={{ duration: 1.6 + index * 0.3, repeat: Infinity, delay: SETTLE_SECONDS }}
                        />
                    ))}

                    {/* Ink: one bold outline, one thin core outline and a shine. Nothing else, so it stays calm */}
                    <motion.g
                        filter={INK_BOIL_FILTER}
                        animate={{ opacity: is_bursting ? 0 : 1 }}
                        transition={{ duration: 0.18 }}
                    >
                        <motion.path
                            d={FLAME_PATH}
                            fill="none"
                            stroke={INK_COLOR}
                            strokeWidth={3.4}
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: INK_DRAW_SECONDS, delay: ink_delay, ease: [0.5, 0, 0.2, 1] }}
                        />
                        <motion.path
                            d={FLAME_PATH}
                            transform={core_transform}
                            fill="none"
                            stroke={INK_COLOR}
                            strokeWidth={1.8}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: INK_DRAW_SECONDS * 0.8, delay: ink_delay + 0.45, ease: [0.5, 0, 0.2, 1] }}
                        />
                        <motion.path
                            d={SHINE_PATH}
                            fill="none"
                            stroke="#ffffff"
                            strokeOpacity={0.75}
                            strokeWidth={4}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.35, delay: SETTLE_SECONDS - 0.35 }}
                        />
                    </motion.g>
                </motion.g>

                {/* Sparks only start once the flame is complete, then appear one by one */}
                {!is_bursting && (
                    <g filter={INK_BOIL_FILTER}>
                        {SPARK_SPOTS.slice(0, effects.spark_count).map(([x, y], index) => (
                            // Outer <g> places the spark; Motion only moves the inner path
                            <g key={`spark-${index}`} transform={`translate(${x} ${y})`}>
                                <motion.path
                                    d={SPARK_PATH}
                                    fill={colors.shades[3]}
                                    stroke={INK_COLOR}
                                    strokeWidth={1.4}
                                    strokeLinejoin="round"
                                    initial={{ opacity: 0, y: 0 }}
                                    animate={{ opacity: [0, 1, 1, 0], y: [0, -SPARK_RISE * 0.3, -SPARK_RISE * 0.7, -SPARK_RISE] }}
                                    transition={{
                                        duration: SPARK_FLIGHT_SECONDS,
                                        times: [0, 0.2, 0.7, 1],
                                        ease: 'easeOut',
                                        repeat: Infinity,
                                        delay: SETTLE_SECONDS + index * SPARK_SPAWN_GAP,
                                    }}
                                />
                            </g>
                        ))}
                    </g>
                )}
            </svg>

            {is_mystery && (
                <motion.span
                    key={`mystery-${props.tier_index}`}
                    className={styles.mystery_mark}
                    aria-hidden="true"
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ scale: { type: 'spring', stiffness: 420, damping: 16, delay: 0.9 }, opacity: { duration: 0.2, delay: 0.9 } }}
                >
                    ?
                </motion.span>
            )}
        </div>
    );
}
