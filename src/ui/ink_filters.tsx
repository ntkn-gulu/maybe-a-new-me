// Shared SVG filters for the paper + ink look, mounted once in App.
// - ink-rough-a/b/c: three hand-drawn wobbles with different noise. Ink that
//                    "boils" is drawn three times, one per filter, and CSS shows
//                    one copy at a time (see paper_flame.module.css). Each copy is
//                    rendered once, so the boil costs no redraw at all.
// - ink-rough:       a single frozen wobble for ink that does not boil (dial, chest)
// - paper-lift:      soft drop shadow under a cut-out paper layer
// - sketch-hatch:    diagonal pen hatching, used for shadows in the sketch theme
// None of these filters is animated: animating a filter makes the browser
// recompute it every frame, which is slow on iPhone.

export const INK_BOIL_FRAMES = ['url(#ink-rough-a)', 'url(#ink-rough-b)', 'url(#ink-rough-c)'];
export const INK_ROUGH_FILTER = 'url(#ink-rough)';
export const PAPER_LIFT_FILTER = 'url(#paper-lift)';

const BOIL_SEEDS = [1, 5, 9];             // one noise pattern per boil frame
const BOIL_STRENGTH = 3.2;                // how far boiling lines wobble, in SVG units
const ROUGH_STRENGTH = 2.6;

export function InkFilters()
{
    return (
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
            <defs>
                {BOIL_SEEDS.map((seed, index) => (
                    <filter key={seed} id={`ink-rough-${'abc'[index]}`} x="-15%" y="-15%" width="130%" height="130%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={seed} result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale={BOIL_STRENGTH} xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                ))}

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
