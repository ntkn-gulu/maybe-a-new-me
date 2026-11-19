import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/rng';
import {
    MUSIC_CHANNELS,
    clampTrackIndex,
    getChannel,
    getNextTrackIndex,
    getPlayableChannels,
    getPreviousTrackIndex,
    getTrack,
} from '../src/core/music_queue';

const LOFI_COUNT = getChannel('lofi').tracks.length;

describe('music queue', () =>
{
    it('goes through the tracks in order and wraps around', () =>
    {
        expect(getNextTrackIndex('lofi', 0, false, Math.random)).toBe(1);
        expect(getNextTrackIndex('lofi', LOFI_COUNT - 1, false, Math.random)).toBe(0);
        expect(getPreviousTrackIndex('lofi', 0)).toBe(LOFI_COUNT - 1);
    });

    it('never shuffles onto the same track twice in a row', () =>
    {
        const random = createSeededRandom(5);
        let index = 3;
        for (let i = 0; i < 200; i++)
        {
            const next = getNextTrackIndex('lofi', index, true, random);
            expect(next).not.toBe(index);
            expect(next).toBeGreaterThanOrEqual(0);
            expect(next).toBeLessThan(LOFI_COUNT);
            index = next;
        }
    });

    it('keeps a saved position inside the channel', () =>
    {
        expect(clampTrackIndex('lofi', LOFI_COUNT + 2)).toBe(2);
        expect(clampTrackIndex('lofi', -1)).toBe(LOFI_COUNT - 1);
        expect(getTrack('lofi', LOFI_COUNT)).toBe(getChannel('lofi').tracks[0]);
    });

    it('hides channels without tracks and has unique track ids', () =>
    {
        expect(getPlayableChannels().every((channel) => channel.tracks.length > 0)).toBe(true);
        const ids = MUSIC_CHANNELS.flatMap((channel) => channel.tracks.map((track) => `${channel.id}/${track.id}`));
        expect(new Set(ids).size).toBe(ids.length);
    });
});
