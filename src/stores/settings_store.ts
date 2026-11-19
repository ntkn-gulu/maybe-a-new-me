import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';
import type { Language } from '../i18n/strings';
import { DEFAULT_DATE_FORMAT, type DateFormat } from '../i18n/date_format';
import type { AppTheme } from './active_theme';
import type { DayKey } from '../core/types';

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
    is_dev_unlock_all: boolean;  // dev mode only: every item can be equipped, owned or not (nothing is added to the inventory)
    has_seen_onboarding: boolean; // the first-run walkthrough was finished (Settings can replay it)
    last_backup_day: DayKey | null; // day the last backup file was saved (null = never)

    setLanguage: (language: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSfxVolume: (volume: number) => void;
    setHapticEnabled: (enabled: boolean) => void;
    toggleDevMode: () => void;
    setDateFormat: (format: DateFormat) => void;
    setDevTheme: (theme: AppTheme | null) => void;
    toggleDevUnlockAll: () => void;
    finishOnboarding: () => void;
    replayOnboarding: () => void;
    markBackupSaved: (day_key: DayKey) => void;
}

export const SETTINGS_STORAGE_KEY = 'mnm-settings';
// 1: the old "paper_ink" theme no longer exists
// 2: the theme comes from the equipped item; the old setting becomes the dev preview
// 3: onboarding exists; people who already use the app skip it
const SETTINGS_STORAGE_VERSION = 3;

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'en',               // new installs start in English (Settings switches to Vietnamese)
            is_sound_enabled: true,
            sfx_volume: 0.8,
            is_haptic_enabled: true,
            is_dev_mode: false,
            date_format: DEFAULT_DATE_FORMAT,
            dev_theme: null,
            is_dev_unlock_all: false,
            has_seen_onboarding: false,
            last_backup_day: null,

            setLanguage: (language) => set({ language }),
            setSoundEnabled: (enabled) => set({ is_sound_enabled: enabled }),
            setSfxVolume: (volume) => set({ sfx_volume: volume }),
            setHapticEnabled: (enabled) => set({ is_haptic_enabled: enabled }),
            toggleDevMode: () => set((state) => ({ is_dev_mode: !state.is_dev_mode })),
            setDateFormat: (format) => set({ date_format: format }),
            setDevTheme: (theme) => set({ dev_theme: theme }),
            toggleDevUnlockAll: () => set((state) => ({ is_dev_unlock_all: !state.is_dev_unlock_all })),
            finishOnboarding: () => set({ has_seen_onboarding: true }),
            replayOnboarding: () => set({ has_seen_onboarding: false }),
            markBackupSaved: (day_key) => set({ last_backup_day: day_key }),
        }),
        {
            name: SETTINGS_STORAGE_KEY,
            version: SETTINGS_STORAGE_VERSION,
            migrate: migrateSettings,
        },
    ),
);

// Saved settings from older versions:
// - before 2: a previewed sketch theme stays as the dev preview, any other old theme value is dropped
// - before 3: saved settings mean the app is already in use, so onboarding is skipped
function migrateSettings(persisted: unknown, version: number): SettingsState
{
    const state = persisted as SettingsState & { theme?: string };
    if (version < 2)
    {
        state.dev_theme = state.theme === 'sketch' ? 'sketch' : null;
        delete state.theme;
    }
    if (version < 3)
    {
        state.has_seen_onboarding = true;
    }
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
