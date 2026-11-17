import { useArtStyle } from '../../stores/active_theme';
import { LowPolyFlame } from './low_poly_flame';
import { SketchFlame } from './sketch_flame';

// The flame for the current theme: low-poly in the 3D theme, a marker + ink
// drawing in the sketch theme. Both take the same props.

interface FlameProps
{
    tier_index: number;
    color_id?: string | null;     // equipped flame color item; omit to use the tier colors
    size?: number;                // rendered width in px; omit to size from the --flame-size CSS variable
    is_bursting?: boolean;        // the flame blows apart (level-up screen)
    is_mystery?: boolean;         // locked tier: hide its colors and effects
}

export function Flame(props: FlameProps)
{
    const art_style = useArtStyle();
    return art_style === 'extruded' ? <LowPolyFlame {...props} /> : <SketchFlame {...props} />;
}
