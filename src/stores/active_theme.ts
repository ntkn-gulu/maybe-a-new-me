import { useInventoryStore } from './inventory_store';
import { useSettingsStore } from './settings_store';

// Which theme the app is drawn in. It comes from the theme item equipped in
// the inventory; in dev mode a preview theme from Settings can override it.
// - classic_3d: extruded tiles + low-poly / extruded art (color themes are palettes on it)
// - sketch:     the whole app drawn in a sketchbook (sketch_theme.css + hand-drawn art);
//               the Legendary "theme_sketch" item

export type AppTheme = 'classic_3d' | 'sketch';

// Which set of illustrations (flame, dial, chest) a theme uses
export type ArtStyle = 'extruded' | 'sketch';

export const DEFAULT_THEME: AppTheme = 'classic_3d';

// Theme items that change how the app is drawn; any other theme item
// (a color theme) draws the 3D way
const THEME_BY_ITEM: Record<string, AppTheme> = {
    theme_sketch: 'sketch',
};

// Theme items that already change the app when equipped (color themes come later)
const READY_THEME_ITEMS: ReadonlySet<string> = new Set(['theme_classic', ...Object.keys(THEME_BY_ITEM)]);

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

// Keep <html data-theme> in sync with both stores (at startup and on every change)
function applyActiveTheme(): void
{
    document.documentElement.dataset.theme = readActiveTheme();
}

applyActiveTheme();
useSettingsStore.subscribe(applyActiveTheme);
useInventoryStore.subscribe(applyActiveTheme);
