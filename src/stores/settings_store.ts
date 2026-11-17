import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';
import type { Language } from '../i18n/strings';
import { DEFAULT_DATE_FORMAT, type DateFormat } from '../i18n/date_format';

// How the whole app is drawn. Later themes become items equipped from the collection.
// - classic_3d: extruded tiles + low-poly / extruded art (everyone has it)
// - sketch:     the whole app drawn in a sketchbook (sketch_theme.css + hand-drawn art).
//               Meant as a Legendary chest reward; for now only previewable in dev mode.
export type AppTheme = 'classic_3d' | 'sketch';

// Which set of illustrations (flame, dial, chest) a theme uses
export type ArtStyle = 'extruded' | 'sketch';

export const DEFAULT_THEME: AppTheme = 'classic_3d';

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
const SETTINGS_STORAGE_VERSION = 1;    // 1: the old "paper_ink" theme no longer exists

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
        {
            name: SETTINGS_STORAGE_KEY,
            version: SETTINGS_STORAGE_VERSION,
            migrate: migrateSettings,
        },
    ),
);

// Saved settings from older versions: an unknown theme falls back to the default
function migrateSettings(persisted: unknown): SettingsState
{
    const state = persisted as SettingsState;
    if (state.theme !== 'classic_3d' && state.theme !== 'sketch')
    {
        state.theme = DEFAULT_THEME;
    }
    return state;
}

// The theme actually shown: the sketch theme is a dev-mode preview until
// it can be won from a chest
export function getActiveTheme(state: Pick<SettingsState, 'theme' | 'is_dev_mode'>): AppTheme
{
    return state.theme === 'sketch' && !state.is_dev_mode ? DEFAULT_THEME : state.theme;
}

// Keep engines and the <html> lang / data-theme attributes in sync with the store
// (runs once at startup and again on every change).
function applySettings(state: SettingsState): void
{
    setSfxEnabled(state.is_sound_enabled);
    setSfxVolume(state.sfx_volume);
    setHapticEnabled(state.is_haptic_enabled);
    document.documentElement.lang = state.language;
    document.documentElement.dataset.theme = getActiveTheme(state);
}

export function getArtStyle(theme: AppTheme): ArtStyle
{
    return theme === 'classic_3d' ? 'extruded' : 'sketch';
}

export function useArtStyle(): ArtStyle
{
    return getArtStyle(useSettingsStore(getActiveTheme));
}

applySettings(useSettingsStore.getState());
useSettingsStore.subscribe(applySettings);
