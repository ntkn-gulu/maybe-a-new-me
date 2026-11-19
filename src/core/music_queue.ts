import type { RandomFn } from './types';

// The music player's channels and tracks, and how the queue moves.
// Pure data and functions: the store keeps where each channel left off.
// Files: public/audio/music/<channel>/<track id>.m4a (tools/prepare_music.py).

export type MusicChannelId = 'lofi' | 'jazz';

export interface MusicTrack
{
    id: string;
    title: string;                  // shown as is (track names are not translated)
    artist: string;
}

export interface MusicChannel
{
    id: MusicChannelId;
    tracks: readonly MusicTrack[];
}

const HOLIZNA = 'HoliznaCC0';

export const MUSIC_CHANNELS: readonly MusicChannel[] = [
    {
        id: 'lofi',
        tracks: [
            { id: 'winter_blues', title: 'Winter Blues', artist: HOLIZNA },
            { id: 'first_snow', title: 'First Snow', artist: HOLIZNA },
            { id: 'fire_place', title: 'Fire Place', artist: HOLIZNA },
            { id: 'kids', title: 'Kids', artist: HOLIZNA },
            { id: 'spring_at_last', title: 'Spring At Last', artist: HOLIZNA },
            { id: 'sense_of_purpose', title: 'Sense Of Purpose', artist: HOLIZNA },
            { id: 'april_showers', title: 'April Showers', artist: HOLIZNA },
            { id: 'dreams', title: 'Dreams', artist: HOLIZNA },
            { id: 'angels_we_have_heard_on_high', title: 'Angels We Have Heard On High', artist: HOLIZNA },
            { id: 'kodama', title: 'Kodama', artist: HOLIZNA },
        ],
    },
    {
        id: 'jazz',
        tracks: [],
    },
];

// Channels that have music to play (a channel waiting for its tracks is hidden)
export function getPlayableChannels(): MusicChannel[]
{
    return MUSIC_CHANNELS.filter((channel) => channel.tracks.length > 0);
}

export function getChannel(channel_id: MusicChannelId): MusicChannel
{
    return MUSIC_CHANNELS.find((channel) => channel.id === channel_id) as MusicChannel;
}

// A saved position may point past the end after tracks were removed
export function clampTrackIndex(channel_id: MusicChannelId, index: number): number
{
    const count = getChannel(channel_id).tracks.length;
    return count === 0 ? 0 : ((Math.floor(index) % count) + count) % count;
}

export function getTrack(channel_id: MusicChannelId, index: number): MusicTrack | null
{
    return getChannel(channel_id).tracks[clampTrackIndex(channel_id, index)] ?? null;
}

// The next track: in order (wrapping around), or on shuffle any other track
export function getNextTrackIndex(channel_id: MusicChannelId, index: number, is_shuffle: boolean, random: RandomFn): number
{
    const count = getChannel(channel_id).tracks.length;
    if (count <= 1)
    {
        return 0;
    }
    if (!is_shuffle)
    {
        return clampTrackIndex(channel_id, index + 1);
    }
    const step = 1 + Math.floor(random() * (count - 1));       // never the same track twice in a row
    return clampTrackIndex(channel_id, index + step);
}

export function getPreviousTrackIndex(channel_id: MusicChannelId, index: number): number
{
    return clampTrackIndex(channel_id, index - 1);
}
