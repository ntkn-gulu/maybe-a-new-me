import { useId } from 'react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import { densifyPolygon, hatchLines, samplePath, sketchOutline, SKETCH_INK, type Point } from '../../ui/sketch_draw';
import { GLASS_PATH, PLATE_BOTTOM, PLATE_TOP, POSTS, SAND_BOTTOM_Y, TOP_BULB_PATH, useSandLevel } from './hourglass_shape';
import styles from './skin_dial.module.css';

// "Hourglass" timer skin, sketch version, in marker + ink like the sketch
// flame and chest: marker color slipping down-right past wobbly ink lines,
// pen hatching on the shaded side of the wood. The sand rises in the top
// bulb to the session length (a marker band clipped to the bulb).
// Geometry computed once when the module loads; only the sand's y moves.

const MARKER_SLIP = 'translate(4 3)';
const WOOD_MARKER = '#d9954f';
const SAND_MARKER = '#f5bd3c';

function boxPoints([x, y, width, height]: [number, number, number, number]): Point[]
{
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
}

function boxOutline(box: [number, number, number, number], seed: number): string
{
    return sketchOutline(densifyPolygon(boxPoints(box), 9), 0.7, seed, 2);
}

const PLATE_OUTLINES = [boxOutline(PLATE_TOP, 61), boxOutline(PLATE_BOTTOM, 63)];
const POST_OUTLINES = POSTS.map((post, index) => boxOutline(post, 65 + index * 2));
// Hatching on the right half of each post and the lower band of each plate (shadow side)
const WOOD_HATCH = [
    ...POSTS.map(([x, y, width, height], index) => hatchLines(boxPoints([x + width / 2, y + 2, width / 2, height - 4]), { angle: 60, gap: 4, seed: 71 + index })),
    ...[PLATE_TOP, PLATE_BOTTOM].map(([x, y, width, height], index) => hatchLines(boxPoints([x + 3, y + height * 0.55, width - 6, height * 0.4]), { angle: 30, gap: 4.5, seed: 75 + index })),
].join(' ');
const GLASS_OUTLINE = sketchOutline(samplePath(GLASS_PATH, 10), 0.8, 81, 3);
const GLASS_SHINE = 'M71 46 C71 64 84 79 92 90';
const BOTTOM_PILE = 'M88 163 C92 156 97 153 100 153 C103 153 108 156 112 163';

interface SketchHourglassDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function SketchHourglassDial(props: SketchHourglassDialProps)
{
    const clip_id = useId();
    const sand_y = useSandLevel(props.sweep_degrees);
    const sand_height = useTransform(sand_y, (y) => SAND_BOTTOM_Y - y);
    // The pen line along the top of the sand
    const surface_d = useTransform(sand_y, (y) => `M58 ${y.toFixed(1)} C80 ${(y - 1.5).toFixed(1)} 118 ${(y + 1.5).toFixed(1)} 142 ${y.toFixed(1)}`);

    return (
        <div className={styles.dial}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <defs>
                    <clipPath id={clip_id}>
                        <path d={TOP_BULB_PATH} />
                    </clipPath>
                </defs>

                <g strokeLinecap="round" strokeLinejoin="round">
                    {/* Posts: marker, hatching, ink */}
                    {POSTS.map((post, index) => (
                        <g key={post[0]}>
                            <rect x={post[0]} y={post[1]} width={post[2]} height={post[3]} transform={MARKER_SLIP} fill={WOOD_MARKER} />
                            <path d={POST_OUTLINES[index]} fill="none" stroke={SKETCH_INK} strokeWidth="2.2" />
                        </g>
                    ))}

                    {/* Glass: paper inside, sand marker in the top bulb, a little pile below */}
                    <path d={GLASS_PATH} fill="var(--tile-face, #fbf7ef)" />
                    <g clipPath={`url(#${clip_id})`}>
                        <motion.rect x="56" width="90" y={sand_y} height={sand_height} fill={SAND_MARKER} />
                        <motion.path d={surface_d} fill="none" stroke={SKETCH_INK} strokeWidth="1.6" />
                    </g>
                    <path d={`${BOTTOM_PILE} Z`} transform={MARKER_SLIP} fill={SAND_MARKER} />
                    <path d={BOTTOM_PILE} fill="none" stroke={SKETCH_INK} strokeWidth="1.6" />
                    <path d={GLASS_OUTLINE} fill="none" stroke={SKETCH_INK} strokeWidth="2.6" />
                    <path d={GLASS_SHINE} fill="none" stroke={SKETCH_INK} strokeWidth="1.3" opacity="0.5" />

                    {/* Plates on top: marker, ink */}
                    {[PLATE_TOP, PLATE_BOTTOM].map((plate, index) => (
                        <g key={plate[1]}>
                            <rect x={plate[0]} y={plate[1]} width={plate[2]} height={plate[3]} rx="3" transform={MARKER_SLIP} fill={WOOD_MARKER} />
                            <path d={PLATE_OUTLINES[index]} fill="none" stroke={SKETCH_INK} strokeWidth="2.4" />
                        </g>
                    ))}
                    <path d={WOOD_HATCH} fill="none" stroke={SKETCH_INK} strokeWidth="1.1" opacity="0.75" />
                </g>
            </svg>
        </div>
    );
}
