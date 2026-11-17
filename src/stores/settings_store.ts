import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';
import type { Language } from '../i18n/strings';
import { DEFAULT_DATE_FORMAT, type DateFormat } from '../i18n/date_format';

// User preferences that survive app restarts (saved to localStorage).

interface SettingsState
{
    language: Language;
    is_sound_enabled: boolean;
    sfx_volume: number;          // 0..1
    is_haptic_enabled: boolean;  // experimental iOS switch haptic
    is_dev_mode: boolean;        // hidden: sessions run 25x faster for testing
    date_format: DateFormat;     // dd/mm or mm/dd

    setLanguage: (language: Language) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSfxVolume: (volume: number) => void;
    setHapticEnabled: (enabled: boolean) => void;
    toggleDevMode: () => void;
    setDateFormat: (format: DateFormat) => void;
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

            setLanguage: (language) => set({ language }),
            setSoundEnabled: (enabled) => set({ is_sound_enabled: enabled }),
            setSfxVolume: (volume) => set({ sfx_volume: volume }),
            setHapticEnabled: (enabled) => set({ is_haptic_enabled: enabled }),
            toggleDevMode: () => set((state) => ({ is_dev_mode: !state.is_dev_mode })),
            setDateFormat: (format) => set({ date_format: format }),
        }),
        { name: SETTINGS_STORAGE_KEY },
    ),
);

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
