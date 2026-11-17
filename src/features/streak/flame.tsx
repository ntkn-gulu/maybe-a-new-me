import { useArtStyle } from '../../stores/settings_store';
import { LowPolyFlame } from './low_poly_flame';
import { PaperFlame } from './paper_flame';

// The flame for the current theme: low-poly in the 3D theme, cut paper +
// ink everywhere else. Both take the same props.

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
    return art_style === 'extruded' ? <LowPolyFlame {...props} /> : <PaperFlame {...props} />;
}
