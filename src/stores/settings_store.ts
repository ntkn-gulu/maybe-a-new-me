import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';
import type { Language } from '../i18n/strings';
import { DEFAULT_DATE_FORMAT, type DateFormat } from '../i18n/date_format';

// How the whole app is drawn. Chosen in Settings for now; later themes
// become items equipped from the collection.
// - classic_3d: the original look, extruded tiles + low-poly / extruded art
// - paper_ink:  same tactile UI, illustrations as cut paper + boiling ink ("2.0")
// - sketch:     paper + ink art and the whole UI redrawn as a sketchbook (sketch_theme.css)
export type AppTheme = 'classic_3d' | 'paper_ink' | 'sketch';

// Which set of illustrations (flame, dial, chest) a theme uses
export type ArtStyle = 'extruded' | 'paper_ink';

export const DEFAULT_THEME: AppTheme = 'paper_ink';

// User preferences that survive app restarts (saved to localStorage).

interface SettingsState
{
    language: Language;
    is_sound_enabled: boolean;
    sfx_volume: number;          // 0..1
    is_haptic_enabled: boolean;  // experimental iOS switch haptic
    is_dev_mode: boolean;        // hidden: sessions run 25x faster for testing
    date_format: DateFormat;     // dd/mm or mm/dd
    theme: AppTheme;

    setLanguage: (language: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSfxVolume: (volume: number) => void;
    setHapticEnabled: (enabled: boolean) => void;
    toggleDevMode: () => void;
    setDateFormat: (format: DateFormat) => void;
    setTheme: (theme: AppTheme) => void;
}

const SETTINGS_STORAGE_KEY = 'mnm-settings';

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'vi',
            is_sound_enabled: true,
            sfx_volume: 0.8,
            is_haptic_enabled: true,
            is_dev_mode: false,
            date_format: DEFAULT_DATE_FORMAT,
            theme: DEFAULT_THEME,

            setLanguage: (language) => set({ language }),
            setSoundEnabled: (enabled) => set({ is_sound_enabled: enabled }),
            setSfxVolume: (volume) => set({ sfx_volume: volume }),
            setHapticEnabled: (enabled) => set({ is_haptic_enabled: enabled }),
            toggleDevMode: () => set((state) => ({ is_dev_mode: !state.is_dev_mode })),
            setDateFormat: (format) => set({ date_format: format }),
            setTheme: (theme) => set({ theme }),
        }),
        { name: SETTINGS_STORAGE_KEY },
    ),
);

// Keep engines and the <html> lang / data-theme attributes in sync with the store
// (runs once at startup and again on every change).
function applySettings(state: SettingsState): void
{
    setSfxEnabled(state.is_sound_enabled);
    setSfxVolume(state.sfx_volume);
    setHapticEnabled(state.is_haptic_enabled);
    document.documentElement.lang = state.language;
    document.documentElement.dataset.theme = state.theme;
}

export function getArtStyle(theme: AppTheme): ArtStyle
{
    return theme === 'classic_3d' ? 'extruded' : 'paper_ink';
}

export function useArtStyle(): ArtStyle
{
    return getArtStyle(useSettingsStore((state) => state.theme));
}

applySettings(useSettingsStore.getState());
useSettingsStore.subscribe(applySettings);
