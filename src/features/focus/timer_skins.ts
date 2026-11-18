import { useInventoryStore } from '../../stores/inventory_store';
import { useArtStyle, type ArtStyle } from '../../stores/active_theme';

// Timer skins (Collection items): how the Focus dial and the running
// countdown look. Retro LCD, Nixie and Neon are 3D-only objects; the
// Hourglass has a 3D and a sketch version. A skin that has no version for
// the current art style falls back to the classic dial.

export type TimerSkin = 'classic' | 'retro_lcd' | 'nixie' | 'neon' | 'hourglass';

const SKIN_BY_ITEM: Record<string, TimerSkin> = {
    timer_classic: 'classic',
    timer_retro_lcd: 'retro_lcd',
    timer_nixie: 'nixie',
    timer_neon: 'neon',
    timer_hourglass: 'hourglass',
};

// Art styles each skin is drawn in
const SKIN_ART_STYLES: Record<TimerSkin, readonly ArtStyle[]> = {
    classic: ['extruded', 'sketch'],
    retro_lcd: ['extruded'],
    nixie: ['extruded'],
    neon: ['extruded'],
    hourglass: ['extruded', 'sketch'],
};

export function getTimerSkinForItem(item_id: string): TimerSkin
{
    return SKIN_BY_ITEM[item_id] ?? 'classic';
}

export function isSkinDrawnIn(skin: TimerSkin, art_style: ArtStyle): boolean
{
    return SKIN_ART_STYLES[skin].includes(art_style);
}

// The skin to draw now: the equipped one, or classic when it has no version for this art style
export function useTimerSkin(): TimerSkin
{
    const art_style = useArtStyle();
    const skin = getTimerSkinForItem(useInventoryStore((state) => state.equipped.timer_skin));
    return isSkinDrawnIn(skin, art_style) ? skin : 'classic';
}
