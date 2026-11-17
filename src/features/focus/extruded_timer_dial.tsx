import { motion, useTransform, type MotionValue } from 'motion/react';
import styles from './extruded_timer_dial.module.css';

// The 3D theme's dial (the sketch theme uses SketchTimerDial). A chunky
// kitchen timer built from CSS: an extruded cream ring with ticks and a
// pink disc with thickness; the light wedge shows the session length and
// the blue needle sits at its end. `sweep_degrees` is owned by the Focus screen.

const TICK_COUNT = 60;
const DEGREES_PER_TICK = 6;

// Wedge geometry in the disc's own SVG space (viewBox 0 0 100 100).
// The radius is larger than the disc so the arc edge is hidden by the
// disc's round clip: no thin anti-aliased rim can show.
const WEDGE_CENTER = 50;
const WEDGE_RADIUS = 60;
const MAX_WEDGE_DEGREES = 359.9;       // a full 360 arc would collapse to nothing

// SVG pie slice from 12 o'clock, clockwise, to `degrees`
function wedgePath(degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0), MAX_WEDGE_DEGREES);
    const radians = (clamped * Math.PI) / 180;
    const end_x = WEDGE_CENTER + WEDGE_RADIUS * Math.sin(radians);
    const end_y = WEDGE_CENTER - WEDGE_RADIUS * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${WEDGE_CENTER} ${WEDGE_CENTER} L ${WEDGE_CENTER} ${WEDGE_CENTER - WEDGE_RADIUS} `
        + `A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large_arc} 1 ${end_x} ${end_y} Z`;
}

interface ExtrudedTimerDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function ExtrudedTimerDial(props: ExtrudedTimerDialProps)
{
    const wedge_d = useTransform(props.sweep_degrees, wedgePath);

    return (
        <div className={styles.dial}>
            <div className={styles.dial_ring}>
                {Array.from({ length: TICK_COUNT }, (_, index) => (
                    <span
                        key={index}
                        className={index % 5 === 0 ? `${styles.tick} ${styles.tick_major}` : styles.tick}
                        style={{ transform: `rotate(${index * DEGREES_PER_TICK}deg)` }}
                    />
                ))}
            </div>
            <div className={styles.dial_disc}>
                <svg className={styles.wedge} viewBox="0 0 100 100" aria-hidden="true">
                    <motion.path d={wedge_d} className={styles.wedge_path} />
                </svg>
            </div>
            {/* Needle layer sits outside the clipped disc. Its drop shadow is on this
                non-rotating wrapper, so the light direction stays fixed while it turns. */}
            <div className={styles.needle_layer}>
                <motion.div className={styles.needle} style={{ rotate: props.sweep_degrees }}>
                    <span className={styles.needle_bar} />
                </motion.div>
                <span className={styles.hub} />
            </div>
        </div>
    );
}
