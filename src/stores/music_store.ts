import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    clampTrackIndex,
    getChannel,
    getNextTrackIndex,
    getPreviousTrackIndex,
    getTrack,
    type MusicChannelId,
    type MusicTrack,
} from '../core/music_queue';
import { MUSIC_TRACK_OVERLAP_SECONDS, onMusicTrackEnding, setMusicTarget } from '../sound/music_engine';
import { unlockAudio } from '../sound/audio_context';
import { useAmbientStore } from './ambient_store';

// The music player of the Sound room: which channel plays (or none), where
// each channel left off, shuffle and the music volume. Playing and pausing
// are shared with the ambient mix (ambient_store.is_playing): the record
// deck plays or pauses everything at once.

interface MusicState
{
    channel: MusicChannelId | null;                                     // null: music off
    track_by_channel: Partial<Record<MusicChannelId, number>>;          // where each channel left off
    is_shuffle: boolean;
    volume: number;                                                     // 0..1
    crossfade_seconds: number;                                          // how the last track change blends (not saved)
    is_volume_open: boolean;                                            // the player's volume drawer (open on a first visit, so people find it)

    setChannel: (channel: MusicChannelId | null) => void;
    nextTrack: (is_skip: boolean) => void;
    previousTrack: () => void;
    toggleShuffle: () => void;
    setVolume: (volume: number) => void;
    toggleVolumeOpen: () => void;
}

export const MUSIC_STORAGE_KEY = 'mnm-music';

// A tap on next / previous blends quickly; a track running out blends slowly
const SKIP_CROSSFADE_SECONDS = 0.8;

function trackIndex(state: MusicState, channel: MusicChannelId): number
{
    return clampTrackIndex(channel, state.track_by_channel[channel] ?? 0);
}

export const useMusicStore = create<MusicState>()(
    persist(
        (set, get) => ({
            channel: null,
            track_by_channel: {},
            is_shuffle: false,
            volume: 0.7,
            crossfade_seconds: SKIP_CROSSFADE_SECONDS,
            is_volume_open: true,

            // Picking a channel means "let me hear it": playback starts too
            setChannel: (channel) =>
            {
                set({ channel, crossfade_seconds: SKIP_CROSSFADE_SECONDS });
                if (channel)
                {
                    playSoundRoom();
                }
            },
            nextTrack: (is_skip) =>
            {
                const { channel, is_shuffle } = get();
                if (!channel)
                {
                    return;
                }
                const next = getNextTrackIndex(channel, trackIndex(get(), channel), is_shuffle, Math.random);
                set({
                    track_by_channel: { ...get().track_by_channel, [channel]: next },
                    crossfade_seconds: is_skip ? SKIP_CROSSFADE_SECONDS : MUSIC_TRACK_OVERLAP_SECONDS,
                });
            },
            previousTrack: () =>
            {
                const { channel } = get();
                if (!channel)
                {
                    return;
                }
                set({
                    track_by_channel: { ...get().track_by_channel, [channel]: getPreviousTrackIndex(channel, trackIndex(get(), channel)) },
                    crossfade_seconds: SKIP_CROSSFADE_SECONDS,
                });
            },
            toggleShuffle: () => set({ is_shuffle: !get().is_shuffle }),
            setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
            toggleVolumeOpen: () => set({ is_volume_open: !get().is_volume_open }),
        }),
        {
            name: MUSIC_STORAGE_KEY,
            partialize: (state) => ({
                channel: state.channel,
                track_by_channel: state.track_by_channel,
                is_shuffle: state.is_shuffle,
                volume: state.volume,
                is_volume_open: state.is_volume_open,
            }),
            // A saved channel that has no tracks (any more) means music off
            merge: (persisted, current) =>
            {
                const saved = { ...current, ...(persisted as Partial<MusicState> | undefined) };
                const is_known = saved.channel !== null && getChannel(saved.channel)?.tracks.length > 0;
                return { ...saved, channel: is_known ? saved.channel : null };
            },
        },
    ),
);

// The track the music channel is on now (null: music off)
export function useCurrentTrack(): MusicTrack | null
{
    const channel = useMusicStore((state) => state.channel);
    const index = useMusicStore((state) => (state.channel ? state.track_by_channel[state.channel] ?? 0 : 0));
    return channel ? getTrack(channel, index) : null;
}

// Start the Sound room from a tap: music and the ambient mix together
function playSoundRoom(): void
{
    unlockAudio();
    useAmbientStore.getState().play();
}

// The record deck and the mini player: play or pause everything. With no
// music channel and an empty mix, the ambient store starts its first preset.
export function toggleSoundRoom(): void
{
    const ambient = useAmbientStore.getState();
    if (ambient.is_playing)
    {
        ambient.pause();
        return;
    }
    if (useMusicStore.getState().channel && ambient.mix.active.length === 0)
    {
        playSoundRoom();
        return;
    }
    ambient.togglePlaying();
}

// Keep the music engine on both stores (runs at startup and on every change)
function applyMusic(): void
{
    const music = useMusicStore.getState();
    const track = music.channel ? getTrack(music.channel, trackIndex(music, music.channel)) : null;
    setMusicTarget({
        url: track && music.channel ? `${import.meta.env.BASE_URL}audio/music/${music.channel}/${track.id}.m4a` : null,
        is_playing: useAmbientStore.getState().is_playing,
        volume: music.volume,
        crossfade_seconds: music.crossfade_seconds,
    });
}

applyMusic();
useMusicStore.subscribe(applyMusic);
useAmbientStore.subscribe(applyMusic);
onMusicTrackEnding(() => useMusicStore.getState().nextTrack(false));
