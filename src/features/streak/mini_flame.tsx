import type { ArtStyle } from '../../stores/active_theme';
import type { FlameColors } from './flame_palettes';
import { INK_COLOR, MINI_FLAME_MARKER, MINI_FLAME_OUTLINE } from './sketch_flame_art';

// A small flame badge (tier strip, collection): a filled faceted outline in
// the 3D theme, marker color under a hand-drawn ink line in the sketch theme.
// No colors = an empty outline (a locked tier). Size comes from the parent's CSS.

// The 3D theme keeps the original faceted outline
const MINI_LOW_POLY_POINTS = '104,8 130,62 157,118 167,170 150,222 100,250 50,222 33,170 47,122 70,86 60,40 84,94';

interface MiniFlameProps
{
    colors: FlameColors | null;
    art_style: ArtStyle;
    className?: string;
}

export function MiniFlame(props: MiniFlameProps)
{
    const colors = props.colors;
    return (
        <svg viewBox="0 0 200 260" className={props.className} aria-hidden="true">
            {props.art_style === 'extruded'
                ? (
                    <polygon
                        points={MINI_LOW_POLY_POINTS}
                        fill={colors ? colors.shades[2] : 'none'}
                        stroke={colors ? colors.shades[0] : 'var(--color-ink-faint)'}
                        strokeWidth={colors ? 10 : 14}
                        strokeLinejoin="round"
                    />
                )
                : (
                    // Marker color slipping past a hand-drawn ink line
                    <g strokeLinecap="round" strokeLinejoin="round">
                        {colors && <path d={MINI_FLAME_MARKER} fill={colors.shades[2]} />}
                        <path
                            d={MINI_FLAME_OUTLINE}
                            fill="none"
                            stroke={colors ? INK_COLOR : 'var(--color-ink-faint)'}
                            strokeWidth={colors ? 13 : 11}
                        />
                    </g>
                )}
        </svg>
    );
}
