import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BOIL_SEEDS, INK_COLOR, inkWobbleFilter, paperLiftFilter, svgImage } from '../../ui/ink_svg';
import { MYSTERY_COLORS, MYSTERY_EFFECTS, getFlameColors, getFlameEffects, type FlameColors, type FlameEffects } from './flame_palettes';
import styles from './paper_flame.module.css';

// The flame as cut paper + hand-drawn ink, like a pop-up in a sketchbook.
// Colored paper layers (outer to core) pop up one by one, then the ink
// outline draws itself; once complete it keeps "boiling" (wobbling like
// hand-drawn animation) and little flame-tip sparks start drifting up, one at a time.
// - colors: tier or equipped flame item; effects (layers, sparks, stars) follow the tier
// - is_mystery: a locked tier, blank paper with a "?"
// - is_bursting: the layers blow apart (level-up screen)
//
// Smooth on iPhone: every filtered picture (paper layers with shadows, the
// three wobbly ink frames) is baked into an image once (see ink_svg.ts).
// While the outline draws itself it is plain, unfiltered strokes; then the
// baked ink frames take over and CSS only flips their opacity. Sway, sparks
// and stars move finished pictures as GPU layers.

// Three-tongue flame silhouette (viewBox 0 0 200 260), base at (100, 248)
const FLAME_PATH = 'M100 12 C108 46 126 66 132 92 C140 80 146 68 146 54 C166 84 176 120 172 160 '
    + 'C168 214 136 248 100 248 C62 248 30 214 30 168 C30 130 40 100 52 62 C64 84 70 100 76 112 C74 76 84 44 100 12 Z';
const VIEW_BOX = '0 0 200 260';
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 260;
const BASE_Y = 248;

// Cartoon shine along the lit (left) side of the outer layer
const SHINE_PATH = 'M46 198 C40 178 41 158 48 140';

// Little flame tip used for sparks, in its own small viewBox
const SPARK_PATH = 'M6 1 C9 6 11 10 6 14 C1 10 3 6 6 1 Z';

// Where sparks start, in flame viewBox units (they drift up from here)
const SPARK_SPOTS: [number, number][] = [[46, 70], [156, 58], [154, 128], [40, 136], [104, 2], [174, 96]];

// Stars cut into the galaxy flame: [x, y, size] in flame viewBox units
const STAR_SPOTS: [number, number, number][] = [[86, 156, 10], [118, 120, 8], [98, 206, 8], [130, 186, 7], [72, 188, 6]];
const STAR_PATH = 'M5 0 L6.5 3.5 L10 5 L6.5 6.5 L5 10 L3.5 6.5 L0 5 L3.5 3.5 Z';

const INNERMOST_SCALE = 0.36;         // size of the core layer relative to the outer one
const OUTLINE_WIDTH = 3.4;
const CORE_OUTLINE_WIDTH = 1.8;       // in flame units, whatever the core's scale
const LAYER_POP_START = 0.08;         // seconds before the first layer pops up
const LAYER_STAGGER = 0.12;           // seconds between layers
const INK_DRAW_SECONDS = 0.75;        // outline drawing time
const SETTLE_SECONDS = 1.55;          // flame fully drawn; boil and sparks start after this
const SPARK_SPAWN_GAP = 0.65;         // seconds between the first appearance of each spark
const SPARK_FLIGHT_SECONDS = 2.6;
const SPARK_RISE = '-360%';           // of the spark's own height
const BURST_SCATTER = 170;            // viewBox units a layer flies when bursting

interface PaperLayer
{
    scale: number;
    transform: string;
    color: string;
}

function buildLayers(colors: FlameColors, effects: FlameEffects): PaperLayer[]
{
    // Outer layer uses the darkest shade, the core the lightest
    const palette = [colors.shades[0], colors.shades[1], colors.shades[2], colors.shades[3], colors.core[0], colors.core[1]];
    const count = effects.layer_count;
    return Array.from({ length: count }, (_, index) =>
    {
        const scale = 1 - index * ((1 - INNERMOST_SCALE) / (count - 1));
        const offset_x = index === 0 ? 0 : (index % 2 === 1 ? -3 : 3);   // slightly off-center, like hand-cut paper
        // Fewer layers skip middle shades, so the core stays the lightest
        const color = palette[Math.round((index / (count - 1)) * (palette.length - 1))];
        const transform = `translate(${100 + offset_x} ${BASE_Y}) scale(${scale}) translate(-100 -${BASE_Y})`;
        return { scale, transform, color };
    });
}

// The ink drawing: bold outline, thin core outline, white shine
function inkMarkup(core: PaperLayer): string
{
    return `<path d="${FLAME_PATH}" fill="none" stroke="${INK_COLOR}" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`
        + `<path d="${FLAME_PATH}" transform="${core.transform}" fill="none" stroke="${INK_COLOR}" `
        + `stroke-width="${CORE_OUTLINE_WIDTH / core.scale}" stroke-linejoin="round"/>`
        + `<path d="${SHINE_PATH}" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="4" stroke-linecap="round"/>`;
}

// Deterministic pseudo-random in [-1, 1] so scatter is stable between renders
function scatter(seed: number): number
{
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

// Position of a flame-viewBox point as CSS percentages of the flame box
function percentLeft(x: number): string
{
    return `${(x / VIEW_WIDTH) * 100}%`;
}

function percentTop(y: number): string
{
    return `${(y / VIEW_HEIGHT) * 100}%`;
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
    const colors = is_mystery ? MYSTERY_COLORS : getFlameColors(props.tier_index, props.color_id ?? null);
    const effects = is_mystery ? MYSTERY_EFFECTS : getFlameEffects(props.tier_index);
    const redraw_key = `${props.tier_index}-${props.color_id ?? ''}-${is_mystery}`;
    const is_bursting = props.is_bursting ?? false;

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

            {/* Keyed: a new tier / color / mystery state draws the flame again from scratch */}
            <FlameBody key={redraw_key} colors={colors} effects={effects} is_bursting={is_bursting} />

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

interface FlameBodyProps
{
    colors: FlameColors;
    effects: FlameEffects;
    is_bursting: boolean;
}

function FlameBody(props: FlameBodyProps)
{
    const { colors, effects, is_bursting } = props;
    const [is_settled, setIsSettled] = useState(false);

    // Bake once per flame: the paper layers and three wobbly ink frames
    const art = useMemo(() =>
    {
        const layers = buildLayers(colors, effects);
        const layer_images = layers.map((layer) => svgImage(
            VIEW_BOX,
            `<defs>${paperLiftFilter('lift')}</defs>`
            + `<path d="${FLAME_PATH}" transform="${layer.transform}" fill="${layer.color}" filter="url(#lift)"/>`,
        ));
        const core = layers[layers.length - 1];
        const ink_images = BOIL_SEEDS.map((seed) => svgImage(
            VIEW_BOX,
            `<defs>${inkWobbleFilter('wobble', seed)}</defs><g filter="url(#wobble)">${inkMarkup(core)}</g>`,
        ));
        return { layer_images, ink_images, core };
    }, [colors, effects]);

    useEffect(() =>
    {
        const timer = window.setTimeout(() => setIsSettled(true), SETTLE_SECONDS * 1000);
        return () => window.clearTimeout(timer);
    }, []);

    const box_class = colors.is_hue_cycling ? `${styles.flame_box} ${styles.rainbow}` : styles.flame_box;

    return (
        <div className={box_class}>
            {/* Everything that sways moves together as one GPU layer */}
            <div className={styles.sway}>
                {art.layer_images.map((source, index) => (
                    <motion.img
                        key={index}
                        className={styles.layer}
                        src={source}
                        alt=""
                        draggable={false}
                        style={{ originX: 0.5, originY: BASE_Y / VIEW_HEIGHT }}
                        initial={{ scale: 0.15, rotate: -8, opacity: 0 }}
                        animate={is_bursting
                            ? {
                                scale: 0.6,
                                rotate: scatter(index + 3) * 120,
                                x: `${scatter(index + 11) * (BURST_SCATTER / VIEW_WIDTH) * 100}%`,
                                y: `${((scatter(index + 23) * BURST_SCATTER * 0.7 - 40) / VIEW_HEIGHT) * 100}%`,
                                opacity: 0,
                            }
                            : { scale: 1, rotate: 0, x: '0%', y: '0%', opacity: 1 }}
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
                    />
                ))}

                <motion.div
                    className={styles.layer}
                    animate={{ opacity: is_bursting ? 0 : 1 }}
                    transition={{ duration: 0.18 }}
                >
                    {is_settled
                        // Baked wobbly ink: CSS shows one frame at a time ("line boil")
                        ? art.ink_images.map((source, frame) => (
                            <img
                                key={source}
                                className={frame === 0 ? `${styles.ink_frame} ${styles.ink_frame_first}` : styles.ink_frame}
                                style={{ animationDelay: `${-frame * 0.125}s` }}
                                src={source}
                                alt=""
                                draggable={false}
                            />
                        ))
                        // Plain strokes while the outline draws itself (no filter: cheap)
                        : (
                            <svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true">
                                <motion.path
                                    d={FLAME_PATH}
                                    fill="none"
                                    stroke={INK_COLOR}
                                    strokeWidth={OUTLINE_WIDTH}
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: INK_DRAW_SECONDS, delay: LAYER_POP_START, ease: [0.5, 0, 0.2, 1] }}
                                />
                                <motion.path
                                    d={FLAME_PATH}
                                    transform={art.core.transform}
                                    fill="none"
                                    stroke={INK_COLOR}
                                    strokeWidth={CORE_OUTLINE_WIDTH / art.core.scale}
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: INK_DRAW_SECONDS * 0.8, delay: LAYER_POP_START + 0.45, ease: [0.5, 0, 0.2, 1] }}
                                />
                            </svg>
                        )}
                </motion.div>

                {effects.has_stars && !is_bursting && STAR_SPOTS.map(([x, y, size], index) => (
                    <motion.svg
                        key={`star-${index}`}
                        className={styles.star}
                        style={{ left: percentLeft(x - size / 2), top: percentTop(y - size / 2), width: percentLeft(size) }}
                        viewBox="0 0 10 10"
                        aria-hidden="true"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ duration: 1.6 + index * 0.3, repeat: Infinity, delay: SETTLE_SECONDS }}
                    >
                        <path d={STAR_PATH} fill="#ffffff" />
                    </motion.svg>
                ))}
            </div>

            {/* Sparks only start once the flame is complete, then appear one by one */}
            {!is_bursting && SPARK_SPOTS.slice(0, effects.spark_count).map(([x, y], index) => (
                <motion.svg
                    key={`spark-${index}`}
                    className={styles.spark}
                    style={{ left: percentLeft(x - 6), top: percentTop(y) }}
                    viewBox="0 0 12 15"
                    aria-hidden="true"
                    initial={{ opacity: 0, y: '0%' }}
                    animate={{ opacity: [0, 1, 1, 0], y: ['0%', '-110%', '-250%', SPARK_RISE] }}
                    transition={{
                        duration: SPARK_FLIGHT_SECONDS,
                        times: [0, 0.2, 0.7, 1],
                        ease: 'easeOut',
                        repeat: Infinity,
                        delay: SETTLE_SECONDS + index * SPARK_SPAWN_GAP,
                    }}
                >
                    <path d={SPARK_PATH} fill={colors.shades[3]} stroke={INK_COLOR} strokeWidth={1.4} strokeLinejoin="round" />
                </motion.svg>
            ))}
        </div>
    );
}
