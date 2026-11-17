import { useReducedMotion } from 'motion/react';

// Shared SVG filters for the paper + ink look, mounted once in App.
// - ink-boil:   hand-drawn wobble whose noise seed steps a few times a second,
//               so ink lines "boil" like traditional hand-drawn animation
// - ink-rough:  the same wobble, frozen (cheap enough for many UI frames)
// - paper-lift: soft drop shadow under a cut-out paper layer
// - sketch-hatch: diagonal pen hatching, used for shadows in the sketch theme
// Browsers stop the seed animation while the app is hidden; with
// "reduce motion" on, the boil is frozen too.

export const INK_BOIL_FILTER = 'url(#ink-boil)';
export const INK_ROUGH_FILTER = 'url(#ink-rough)';
export const PAPER_LIFT_FILTER = 'url(#paper-lift)';

const BOIL_SEEDS = '1;5;9';               // three line shapes, cycled
const BOIL_CYCLE = '0.375s';              // 3 frames in 0.375 s = 8 changes per second
const BOIL_STRENGTH = 3.2;                // how far lines wobble, in SVG units
const ROUGH_STRENGTH = 2.6;

export function InkFilters()
{
    const is_reduced_motion = useReducedMotion();

    return (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
            <defs>
                <filter id="ink-boil" x="-15%" y="-15%" width="130%" height="130%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={1} result="noise">
                        {!is_reduced_motion && (
                            <animate attributeName="seed" values={BOIL_SEEDS} dur={BOIL_CYCLE} calcMode="discrete" repeatCount="indefinite" />
                        )}
                    </feTurbulence>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={BOIL_STRENGTH} xChannelSelector="R" yChannelSelector="G" />
                </filter>

                <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={3} result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale={ROUGH_STRENGTH} xChannelSelector="R" yChannelSelector="G" />
                </filter>

                <filter id="paper-lift" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="1.6" floodColor="#3a2410" floodOpacity="0.32" />
                </filter>

                <pattern id="sketch-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="5" stroke="#1f1c18" strokeWidth={1.1} opacity={0.7} />
                </pattern>
            </defs>
        </svg>
    );
}
