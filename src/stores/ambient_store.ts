import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    AMBIENT_PRESETS,
    EMPTY_MIX,
    applyPreset,
    getActiveLevels,
    isLayerActive,
    keepKnownLayers,
    setLayerLevel,
    toggleLayer,
    type AmbientLayerId,
    type AmbientMix,
    type AmbientPreset,
} from '../core/ambient_mix';
import { setAmbientTarget } from '../sound/ambient_engine';
import { unlockAudio } from '../sound/audio_context';

// The ambient mixer: the saved mix and volume, and whether it plays now.
// Playing is never saved: after a restart the mix waits for a tap (iOS
// only lets audio start from one anyway). Neither is the mini player.

interface AmbientState
{
    mix: AmbientMix;
    volume: number;                 // 0..1, the whole mix
    is_playing: boolean;
    is_player_open: boolean;        // played since the app opened and not dismissed: the mini player shows

    toggleLayer: (layer: AmbientLayerId) => void;
    setLayerLevel: (layer: AmbientLayerId, level: number) => void;
    applyPreset: (preset: AmbientPreset) => void;
    togglePlaying: () => void;
    dismiss: () => void;
    setVolume: (volume: number) => void;
}

export const AMBIENT_STORAGE_KEY = 'mnm-ambient';

// The mix "play" starts when nothing has been picked yet
const STARTER_PRESET = AMBIENT_PRESETS[0];

export const useAmbientStore = create<AmbientState>()(
    persist(
        (set, get) => ({
            mix: EMPTY_MIX,
            volume: 0.8,
            is_playing: false,
            is_player_open: false,

            // Turning a layer on also starts playback (a tap on a sound means "let me hear it")
            toggleLayer: (layer) =>
            {
                const mix = toggleLayer(get().mix, layer);
                const is_turning_on = isLayerActive(mix, layer) && !isLayerActive(get().mix, layer);
                if (is_turning_on)
                {
                    unlockAudio();
                }
                const is_playing = get().is_playing || is_turning_on;
                set({ mix, is_playing, is_player_open: get().is_player_open || is_playing });
            },
            setLayerLevel: (layer, level) => set({ mix: setLayerLevel(get().mix, layer, level) }),
            applyPreset: (preset) =>
            {
                unlockAudio();
                set({ mix: applyPreset(get().mix, preset), is_playing: true, is_player_open: true });
            },
            togglePlaying: () =>
            {
                if (get().is_playing)
                {
                    set({ is_playing: false });
                    return;
                }
                unlockAudio();
                const mix = get().mix.active.length > 0 ? get().mix : applyPreset(get().mix, STARTER_PRESET);
                set({ mix, is_playing: true, is_player_open: true });
            },
            // Close the mini player: stops the sound too
            dismiss: () => set({ is_playing: false, is_player_open: false }),
            setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
        }),
        {
            name: AMBIENT_STORAGE_KEY,
            partialize: (state) => ({ mix: state.mix, volume: state.volume }),
            // A saved mix may name layers that were replaced since
            merge: (persisted, current) =>
            {
                const saved = persisted as Partial<AmbientState> | undefined;
                return { ...current, ...saved, mix: keepKnownLayers(saved?.mix ?? current.mix) };
            },
        },
    ),
);

// Keep the sound engine on the store (runs once at startup and on every change)
function applyAmbient(state: AmbientState): void
{
    setAmbientTarget({ levels: getActiveLevels(state.mix), is_playing: state.is_playing, volume: state.volume });
}

applyAmbient(useAmbientStore.getState());
useAmbientStore.subscribe(applyAmbient);
