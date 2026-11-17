import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MYSTERY_COLORS, MYSTERY_EFFECTS, getFlameColors, getFlameEffects, type FlameColors, type FlameEffects } from './flame_palettes';
import {
    FLAME_BASE_Y,
    FLAME_VIEW_BOX,
    FLAME_VIEW_HEIGHT,
    FLAME_VIEW_WIDTH,
    INK_COLOR,
    SPARK_OUTLINE,
    SPARK_VIEW_BOX,
    buildSketchFlameArt,
    type SketchPiece,
} from './sketch_flame_art';
import styles from './sketch_flame.module.css';

// The sketch theme's flame, drawn with marker + ink (see sketch_flame_art.ts).
// The pen draws the outlines first, the marker color pops in under them, and once finished the outlines keep "boiling" (three
// hand-drawn versions, 6 changes a second) while little flame-tip sparks
// start drifting up one at a time.
// - colors: tier or equipped flame item; effects (sparks, stars) follow the tier
// - is_mystery: a locked tier, gray marker with a "?"
// - is_bursting: the pieces fly apart (level-up screen)
//
// Smooth on iPhone: only plain vector shapes, no SVG filters and no baked
// images. Each piece is its own small SVG inside one swaying GPU layer, so
// moving it is a transform, and the boil only flips the opacity of finished layers.

const OUTLINE_DELAYS = [0, 0.3, 0.55];        // outer flame, middle flame, core
const OUTLINE_DRAW_SECONDS = 0.8;
const BODY_POP_DELAY = 0.5;
const BODY_POP_STAGGER = 0.05;
const BODY_POP_SECONDS = 0.7;
const BODY_POP_EASE = [0.2, 1.5, 0.4, 1] as const;        // a little overshoot, like a pop-up
const PEN_EASE = [0.5, 0, 0.2, 1] as const;
const SETTLE_SECONDS = 1.4;                   // boil, sparks and stars start after this
const SPARK_SPAWN_GAP = 0.65;
const SPARK_FLIGHT_SECONDS = 2.6;
const SPARK_RISE = '-360%';                   // of the spark's own height
const BURST_SCATTER = 170;                    // viewBox units a piece flies when bursting

// Where sparks start, in flame viewBox units (they drift up from here)
const SPARK_SPOTS: [number, number][] = [[40, 50], [160, 36], [150, 110], [52, 120], [100, 0], [176, 80]];

// Twinkles on the galaxy flame: [x, y] in flame viewBox units
const STAR_SPOTS: [number, number][] = [[84, 150], [118, 112], [96, 206], [130, 186], [70, 184]];
const STAR_SIZE = 12;

// Deterministic pseudo-random in [-1, 1] so scatter is stable between renders
function scatter(seed: number): number
{
    const value = Math.sin(seed * 12.9898) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

function percentLeft(x: number): string
{
    return `${(x / FLAME_VIEW_WIDTH) * 100}%`;
}

function percentTop(y: number): string
{
    return `${(y / FLAME_VIEW_HEIGHT) * 100}%`;
}

interface SketchFlameProps
{
    tier_index: number;
    color_id?: string | null;     // equipped flame color item; omit to use the tier colors
    size?: number;                // rendered width in px; omit to size from the --flame-size CSS variable
    is_bursting?: boolean;        // the pieces fly apart and fade out
    is_mystery?: boolean;         // locked tier: gray marker, no tier effects
}

export function SketchFlame(props: SketchFlameProps)
{
    const is_mystery = props.is_mystery ?? false;
    const colors = is_mystery ? MYSTERY_COLORS : getFlameColors(props.tier_index, props.color_id ?? null);
    const effects = is_mystery ? MYSTERY_EFFECTS : getFlameEffects(props.tier_index);
    const redraw_key = `${props.tier_index}-${props.color_id ?? ''}-${is_mystery}`;

    return (
        <div className={styles.stage} style={props.size ? { width: props.size, height: props.size * 1.3 } : undefined}>
            {/* Keyed: a new tier / color / mystery state draws the flame again from scratch */}
            <FlameBody
                key={redraw_key}
                colors={colors}
                effects={effects}
                is_bursting={props.is_bursting ?? false}
            />

            {is_mystery && (
                <motion.span
                    key={`mystery-${props.tier_index}`}
                    className={styles.mystery_mark}
                    aria-hidden="true"
                    initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
                    animate={{ scale: 1, opacity: 1, rotate: -6 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.9, opacity: { duration: 0.2, delay: 0.9 } }}
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
    const art = useMemo(() => buildSketchFlameArt(colors), [colors]);
    const [is_settled, setIsSettled] = useState(false);

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
                {art.body.map((piece, index) => (
                    <motion.svg
                        key={index}
                        className={styles.layer}
                        viewBox={FLAME_VIEW_BOX}
                        aria-hidden="true"
                        style={{ originX: 0.5, originY: FLAME_BASE_Y / FLAME_VIEW_HEIGHT }}
                        initial={{ scale: 0.2, rotate: -6, opacity: 0 }}
                        animate={is_bursting
                            ? {
                                scale: 0.6,
                                rotate: scatter(index + 3) * 120,
                                x: `${scatter(index + 11) * (BURST_SCATTER / FLAME_VIEW_WIDTH) * 100}%`,
                                y: `${((scatter(index + 23) * BURST_SCATTER * 0.7 - 40) / FLAME_VIEW_HEIGHT) * 100}%`,
                                opacity: 0,
                            }
                            : { scale: 1, rotate: 0, x: '0%', y: '0%', opacity: 1 }}
                        transition={is_bursting
                            ? { type: 'spring', stiffness: 110, damping: 15, opacity: { duration: 0.45, delay: 0.1 } }
                            : {
                                duration: BODY_POP_SECONDS,
                                ease: BODY_POP_EASE,
                                delay: BODY_POP_DELAY + index * BODY_POP_STAGGER,
                                opacity: { duration: 0.1, delay: BODY_POP_DELAY + index * BODY_POP_STAGGER },
                            }}
                    >
                        <PiecePath piece={piece} />
                    </motion.svg>
                ))}

                <motion.div
                    className={styles.layer}
                    animate={{ opacity: is_bursting ? 0 : 1 }}
                    transition={{ duration: 0.18 }}
                >
                    {is_settled
                        // Line boil: CSS shows one finished set of outlines at a time
                        ? art.outline_frames.map((frame, frame_index) => (
                            <svg
                                key={frame_index}
                                className={frame_index === 0 ? `${styles.boil_frame} ${styles.boil_frame_first}` : styles.boil_frame}
                                style={{ animationDelay: `${-frame_index / 6}s` }}
                                viewBox={FLAME_VIEW_BOX}
                                aria-hidden="true"
                            >
                                {frame.map((piece, index) => <PiecePath key={index} piece={piece} />)}
                            </svg>
                        ))
                        // The pen drawing the outlines for the first time
                        : (
                            <svg className={styles.layer} viewBox={FLAME_VIEW_BOX} aria-hidden="true">
                                {art.outline_frames[0].map((piece, index) => (
                                    <PiecePath key={index} piece={piece} draw_delay={OUTLINE_DELAYS[index] ?? 0} />
                                ))}
                            </svg>
                        )}
                </motion.div>

                {effects.has_stars && is_settled && !is_bursting && STAR_SPOTS.map(([x, y], index) => (
                    <motion.svg
                        key={`star-${index}`}
                        className={styles.star}
                        style={{ left: percentLeft(x - STAR_SIZE / 2), top: percentTop(y - STAR_SIZE / 2), width: percentLeft(STAR_SIZE) }}
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                        initial={{ opacity: 0, y: '0%' }}
                        animate={{ opacity: [0, 1, 0], y: ['0%', '-150%', '-300%'] }}
                        transition={{ duration: SPARK_FLIGHT_SECONDS, ease: 'easeOut', repeat: Infinity, delay: index * 0.5 }}
                    >
                        <path d="M6 1 L6 11 M1 6 L11 6" stroke="#ffffff" strokeWidth={1.8} strokeLinecap="round" />
                    </motion.svg>
                ))}
            </div>

            {/* Sparks only start once the flame is complete, then appear one by one */}
            {is_settled && !is_bursting && SPARK_SPOTS.slice(0, effects.spark_count).map(([x, y], index) => (
                <motion.svg
                    key={`spark-${index}`}
                    className={styles.spark}
                    style={{ left: percentLeft(x - 6), top: percentTop(y) }}
                    viewBox={SPARK_VIEW_BOX}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: '0%' }}
                    animate={{ opacity: [0, 1, 1, 0], y: ['0%', '-110%', '-250%', SPARK_RISE] }}
                    transition={{
                        duration: SPARK_FLIGHT_SECONDS,
                        times: [0, 0.2, 0.7, 1],
                        ease: 'easeOut',
                        repeat: Infinity,
                        delay: index * SPARK_SPAWN_GAP,
                    }}
                >
                    <path d={SPARK_OUTLINE} fill={art.spark_fill} stroke={INK_COLOR} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
            ))}
        </div>
    );
}

interface PiecePathProps
{
    piece: SketchPiece;
    draw_delay?: number;          // animate the pen drawing it, starting after this many seconds
}

function PiecePath(props: PiecePathProps)
{
    const { piece } = props;
    const draw = props.draw_delay === undefined
        ? {}
        : {
            // Opacity hides the round cap dot before the pen starts
            initial: { pathLength: 0, opacity: 0 },
            animate: { pathLength: 1, opacity: 1 },
            transition: {
                pathLength: { duration: OUTLINE_DRAW_SECONDS, delay: props.draw_delay, ease: PEN_EASE },
                opacity: { duration: 0.01, delay: props.draw_delay },
            },
        };
    return (
        <motion.path
            d={piece.d}
            fill={piece.fill ?? 'none'}
            stroke={piece.stroke ?? 'none'}
            strokeWidth={piece.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: piece.opacity }}
            {...draw}
        />
    );
}
