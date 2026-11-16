import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSfxEnabled, setSfxVolume } from '../sound/sfx_engine';
import { setHapticEnabled } from '../sound/haptic_hack';

// User preferences that survive app restarts (saved to localStorage).

interface SettingsState
{
    is_sound_enabled: boolean;
    sfx_volume: number;          // 0..1
    is_haptic_enabled: boolean;  // experimental iOS switch haptic

    setSoundEnabled: (enabled: boolean) => void;
    setSfxVolume: (volume: number) => void;
    setHapticEnabled: (enabled: boolean) => void;
}

const SETTINGS_STORAGE_KEY = 'mnm-settings';

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            is_sound_enabled: true,
            sfx_volume: 0.8,
            is_haptic_enabled: true,

            setSoundEnabled: (enabled) => set({ is_sound_enabled: enabled }),
            setSfxVolume: (volume) => set({ sfx_volume: volume }),
            setHapticEnabled: (enabled) => set({ is_haptic_enabled: enabled }),
        }),
        { name: SETTINGS_STORAGE_KEY },
    ),
);

// Keep the sound/haptic engines in sync with the store (runs once at startup
// and again on every change), so engines never read React state directly.
function applySettingsToEngines(state: SettingsState): void
{
    setSfxEnabled(state.is_sound_enabled);
    setSfxVolume(state.sfx_volume);
    setHapticEnabled(state.is_haptic_enabled);
}

applySettingsToEngines(useSettingsStore.getState());
useSettingsStore.subscribe(applySettingsToEngines);
