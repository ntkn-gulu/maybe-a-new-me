import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';
import type { Language } from '../i18n/strings';
import { DEFAULT_DATE_FORMAT, type DateFormat } from '../i18n/date_format';
import type { AppTheme } from './active_theme';

// User preferences that survive app restarts (saved to localStorage).

interface SettingsState
{
    language: Language;
    is_sound_enabled: boolean;
    sfx_volume: number;          // 0..1
    is_haptic_enabled: boolean;  // experimental iOS switch haptic
    is_dev_mode: boolean;        // hidden: sessions run 25x faster for testing
    date_format: DateFormat;     // dd/mm or mm/dd
    dev_theme: AppTheme | null;  // dev mode only: preview a theme without owning it (null = the equipped one)

    setLanguage: (language: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSfxVolume: (volume: number) => void;
    setHapticEnabled: (enabled: boolean) => void;
    toggleDevMode: () => void;
    setDateFormat: (format: DateFormat) => void;
    setDevTheme: (theme: AppTheme | null) => void;
}

const SETTINGS_STORAGE_KEY = 'mnm-settings';
// 1: the old "paper_ink" theme no longer exists
// 2: the theme comes from the equipped item; the old setting becomes the dev preview
const SETTINGS_STORAGE_VERSION = 2;

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'vi',
            is_sound_enabled: true,
            sfx_volume: 0.8,
            is_haptic_enabled: true,
            is_dev_mode: false,
            date_format: DEFAULT_DATE_FORMAT,
            dev_theme: null,

            setLanguage: (language) => set({ language }),
            setSoundEnabled: (enabled) => set({ is_sound_enabled: enabled }),
            setSfxVolume: (volume) => set({ sfx_volume: volume }),
            setHapticEnabled: (enabled) => set({ is_haptic_enabled: enabled }),
            toggleDevMode: () => set((state) => ({ is_dev_mode: !state.is_dev_mode })),
            setDateFormat: (format) => set({ date_format: format }),
            setDevTheme: (theme) => set({ dev_theme: theme }),
        }),
        {
            name: SETTINGS_STORAGE_KEY,
            version: SETTINGS_STORAGE_VERSION,
            migrate: migrateSettings,
        },
    ),
);

// Saved settings from older versions: a previewed sketch theme stays as the
// dev preview, any other old theme value is dropped
function migrateSettings(persisted: unknown): SettingsState
{
    const state = persisted as SettingsState & { theme?: string };
    state.dev_theme = state.theme === 'sketch' ? 'sketch' : null;
    delete state.theme;
    return state;
}

// Keep engines and the <html lang> attribute in sync with the store
// (runs once at startup and again on every change).
function applySettings(state: SettingsState): void
{
    setSfxEnabled(state.is_sound_enabled);
    setSfxVolume(state.sfx_volume);
    setHapticEnabled(state.is_haptic_enabled);
    document.documentElement.lang = state.language;
}

applySettings(useSettingsStore.getState());
useSettingsStore.subscribe(applySettings);
