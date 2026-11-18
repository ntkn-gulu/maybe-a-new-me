import { useInventoryStore } from './inventory_store';
import { useSettingsStore } from './settings_store';

// Which theme the app is drawn in. It comes from the theme item equipped in
// the inventory; in dev mode a preview theme from Settings can override it.
// - classic_3d: extruded tiles + low-poly / extruded art. Color theme items
//               keep this drawing style and only swap the colors (a palette,
//               <html data-palette>, palettes.css)
// - sketch:     the whole app drawn in a sketchbook (sketch_theme.css + hand-drawn art);
//               the Legendary "theme_sketch" item

export type AppTheme = 'classic_3d' | 'sketch';

// Color palettes for the 3D theme (null = the default warm paper)
export type AppPalette = 'midnight' | 'matcha' | 'sunset' | 'ocean';

// Which set of illustrations (flame, dial, chest) a theme uses
export type ArtStyle = 'extruded' | 'sketch';

export const DEFAULT_THEME: AppTheme = 'classic_3d';

// Theme items that change how the app is drawn; any other theme item draws the 3D way
const THEME_BY_ITEM: Record<string, AppTheme> = {
    theme_sketch: 'sketch',
};

// Color theme items and the palette each one paints the 3D theme with
const PALETTE_BY_ITEM: Record<string, AppPalette> = {
    theme_midnight: 'midnight',
    theme_matcha: 'matcha',
    theme_sunset: 'sunset',
    theme_ocean: 'ocean',
};

// Theme items that already change the app when equipped
const READY_THEME_ITEMS: ReadonlySet<string> = new Set([
    'theme_classic',
    ...Object.keys(THEME_BY_ITEM),
    ...Object.keys(PALETTE_BY_ITEM),
]);

export function isThemeItemReady(item_id: string): boolean
{
    return READY_THEME_ITEMS.has(item_id);
}

export function getThemeForItem(item_id: string): AppTheme
{
    return THEME_BY_ITEM[item_id] ?? DEFAULT_THEME;
}

export function getActiveTheme(equipped_theme_id: string, dev_theme: AppTheme | null, is_dev_mode: boolean): AppTheme
{
    return is_dev_mode && dev_theme ? dev_theme : getThemeForItem(equipped_theme_id);
}

// A palette only paints the 3D theme (a dev preview of the sketch theme drops it)
export function getActivePalette(equipped_theme_id: string, theme: AppTheme): AppPalette | null
{
    return theme === 'classic_3d' ? PALETTE_BY_ITEM[equipped_theme_id] ?? null : null;
}

export function getArtStyle(theme: AppTheme): ArtStyle
{
    return theme === 'classic_3d' ? 'extruded' : 'sketch';
}

function readActiveTheme(): AppTheme
{
    const settings = useSettingsStore.getState();
    return getActiveTheme(useInventoryStore.getState().equipped.theme, settings.dev_theme, settings.is_dev_mode);
}

export function useActiveTheme(): AppTheme
{
    const equipped_theme_id = useInventoryStore((state) => state.equipped.theme);
    const dev_theme = useSettingsStore((state) => state.dev_theme);
    const is_dev_mode = useSettingsStore((state) => state.is_dev_mode);
    return getActiveTheme(equipped_theme_id, dev_theme, is_dev_mode);
}

export function useArtStyle(): ArtStyle
{
    return getArtStyle(useActiveTheme());
}

// Keep <html data-theme / data-palette> and the browser bar color in sync
// with both stores (at startup and on every change)
function applyActiveTheme(): void
{
    const root = document.documentElement;
    const theme = readActiveTheme();
    const palette = getActivePalette(useInventoryStore.getState().equipped.theme, theme);
    root.dataset.theme = theme;
    if (palette)
    {
        root.dataset.palette = palette;
    }
    else
    {
        delete root.dataset.palette;
    }
    const theme_color = document.querySelector('meta[name="theme-color"]');
    const page_color = getComputedStyle(root).getPropertyValue('--color-bg').trim();
    if (theme_color && page_color)
    {
        theme_color.setAttribute('content', page_color);
    }
}

applyActiveTheme();
useSettingsStore.subscribe(applyActiveTheme);
useInventoryStore.subscribe(applyActiveTheme);
