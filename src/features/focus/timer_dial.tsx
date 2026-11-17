import { motion, useTransform, type MotionValue } from 'motion/react';
import { INK_COLOR, paperLiftFilter, svgImage } from '../../ui/ink_svg';
import styles from './timer_dial.module.css';

// Kitchen-timer dial in the paper + ink style of the flame: a paper face,
// a pink paper disc and a blue paper needle, outlined in clean ink lines.
// The lighter wedge shows the session length; the needle sits at its end.
// `sweep_degrees` is a spring value owned by the Focus screen (6° per minute).
//
// Stacked layers, so turning the dial stays smooth on iPhone: the paper,
// the ink and the hub are images baked once (see ink_svg.ts); only the small
// wedge path redraws while the spring runs, and the needle image is turned
// by the GPU.

const CENTER = 100;                   // viewBox 0 0 200 200
const VIEW_BOX = '0 0 200 200';
const FACE_RADIUS = 94;
const DISC_RADIUS = 64;
const TICK_COUNT = 60;
const TICK_OUTER = 88;
const TICK_INNER_MINOR = 83;
const TICK_INNER_MAJOR = 76;
const WEDGE_RADIUS = 80;              // larger than the disc; the disc clip hides the arc edge
const MAX_WEDGE_DEGREES = 359.9;      // a full 360 arc would collapse to nothing
const NEEDLE_WIDTH = 11;
const NEEDLE_TOP = 46;                // y of the needle tip
const HUB_RADIUS = 14;

const FACE_COLOR = '#fbf8f3';
const DISC_COLOR = '#ff4d6d';
const WEDGE_COLOR = 'rgba(255, 255, 255, 0.42)';
const NEEDLE_COLOR = '#2d4bff';
const HATCH_COLOR = '#1f1c18';

// SVG pie slice from 12 o'clock, clockwise, to `degrees`
function wedgePath(degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0), MAX_WEDGE_DEGREES);
    const radians = (clamped * Math.PI) / 180;
    const end_x = CENTER + WEDGE_RADIUS * Math.sin(radians);
    const end_y = CENTER - WEDGE_RADIUS * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - WEDGE_RADIUS} `
        + `A ${WEDGE_RADIUS} ${WEDGE_RADIUS} 0 ${large_arc} 1 ${end_x} ${end_y} Z`;
}

function tickMarkup(index: number): string
{
    const is_major = index % 5 === 0;
    const radians = (index * 6 * Math.PI) / 180;
    const inner = is_major ? TICK_INNER_MAJOR : TICK_INNER_MINOR;
    const x1 = CENTER + inner * Math.sin(radians);
    const y1 = CENTER - inner * Math.cos(radians);
    const x2 = CENTER + TICK_OUTER * Math.sin(radians);
    const y2 = CENTER - TICK_OUTER * Math.cos(radians);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${is_major ? 3 : 1.3}" opacity="${is_major ? 1 : 0.55}"/>`;
}

// ---------- Baked once when the module loads ----------

const PAPER_IMAGE = svgImage(VIEW_BOX,
    `<defs>${paperLiftFilter('lift')}</defs>`
    + `<circle cx="${CENTER}" cy="${CENTER}" r="${FACE_RADIUS}" fill="${FACE_COLOR}" filter="url(#lift)"/>`
    + `<circle cx="${CENTER}" cy="${CENTER}" r="${DISC_RADIUS}" fill="${DISC_COLOR}" filter="url(#lift)"/>`);

const INK_IMAGE = svgImage(VIEW_BOX,
    `<g stroke="${INK_COLOR}" stroke-linecap="round" fill="none">`
    + `<circle cx="${CENTER}" cy="${CENTER}" r="${FACE_RADIUS}" stroke-width="3"/>`
    + `<circle cx="${CENTER}" cy="${CENTER}" r="${DISC_RADIUS}" stroke-width="2.4"/>`
    + `<line x1="${CENTER}" y1="${CENTER}" x2="${CENTER}" y2="${CENTER - DISC_RADIUS}" stroke-width="1.4"/>`
    + Array.from({ length: TICK_COUNT }, (_, index) => tickMarkup(index)).join('')
    + '</g>');

const NEEDLE_IMAGE = svgImage(VIEW_BOX,
    `<defs>${paperLiftFilter('lift')}</defs>`
    + `<rect x="${CENTER - NEEDLE_WIDTH / 2}" y="${NEEDLE_TOP}" width="${NEEDLE_WIDTH}" height="${CENTER - NEEDLE_TOP + 4}" `
    + `rx="${NEEDLE_WIDTH / 2}" fill="${NEEDLE_COLOR}" stroke="${INK_COLOR}" stroke-width="2.2" filter="url(#lift)"/>`);

const HUB_IMAGE = svgImage(VIEW_BOX,
    `<defs>${paperLiftFilter('lift')}</defs>`
    + `<circle cx="${CENTER}" cy="${CENTER}" r="${HUB_RADIUS}" fill="${NEEDLE_COLOR}" stroke="${INK_COLOR}" stroke-width="2.4" filter="url(#lift)"/>`
    + `<circle cx="${CENTER - 4}" cy="${CENTER - 4}" r="3" fill="#ffffff" opacity="0.7"/>`);

// Hatched "shadow" under the face, only shown in the sketch theme
const HATCH_IMAGE = svgImage(VIEW_BOX,
    '<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
    + `<line x1="0" y1="0" x2="0" y2="5" stroke="${HATCH_COLOR}" stroke-width="1.1" opacity="0.7"/></pattern></defs>`
    + `<circle cx="${CENTER + 5}" cy="${CENTER + 6}" r="${FACE_RADIUS}" fill="url(#hatch)"/>`);

interface TimerDialProps
{
    sweep_degrees: MotionValue<number>;
}

export function TimerDial(props: TimerDialProps)
{
    const wedge_d = useTransform(props.sweep_degrees, wedgePath);

    return (
        <div className={`${styles.dial} sk-no-shadow`}>
            <img className={`${styles.layer} sk-only`} src={HATCH_IMAGE} alt="" draggable={false} />
            <img className={styles.layer} src={PAPER_IMAGE} alt="" draggable={false} />

            {/* The only part that redraws while the dial turns */}
            <svg className={styles.layer} viewBox={VIEW_BOX} aria-hidden="true">
                <defs>
                    <clipPath id="dial-disc-clip">
                        <circle cx={CENTER} cy={CENTER} r={DISC_RADIUS} />
                    </clipPath>
                </defs>
                <motion.path d={wedge_d} fill={WEDGE_COLOR} clipPath="url(#dial-disc-clip)" />
            </svg>

            <img className={styles.layer} src={INK_IMAGE} alt="" draggable={false} />

            {/* Needle turned by the GPU */}
            <motion.img
                className={styles.layer}
                src={NEEDLE_IMAGE}
                alt=""
                draggable={false}
                style={{ rotate: props.sweep_degrees }}
            />

            <img className={styles.layer} src={HUB_IMAGE} alt="" draggable={false} />
        </div>
    );
}
