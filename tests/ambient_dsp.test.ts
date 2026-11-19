import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../src/core/rng';
import { addPing, createTrack, renderNoiseLoop, seamLoop } from '../src/sound/ambient_dsp';
import { renderCrackles } from '../src/sound/ambient_tracks';

function rms(samples: Float32Array): number
{
    let sum = 0;
    for (const value of samples)
    {
        sum += value * value;
    }
    return Math.sqrt(sum / samples.length);
}

describe('ambient dsp', () =>
{
    it('joins a seam so the last sample flows into the first', () =>
    {
        const raw = Float32Array.from({ length: 120 }, (_, i) => i);
        const looped = seamLoop(raw, 100, 20);
        expect(looped.length).toBe(100);
        expect(looped[0]).toBeCloseTo(raw[100]);           // what would have come after the end
        expect(looped[99]).toBe(99);
    });

    it('renders noise beds at the same loudness for every color', () =>
    {
        for (const color of ['white', 'pink', 'brown'] as const)
        {
            const track = renderNoiseLoop(color, 1, 8000, createSeededRandom(1));
            expect(rms(track.channels[0])).toBeCloseTo(0.25, 1);
        }
    });

    it('wraps an event that starts near the end back to the start', () =>
    {
        const track = createTrack(1, 1000, 1);
        addPing(track, 0.99, { hz: 50, decay: 0.05, gain: 1 });
        const head = track.channels[0].slice(0, 30);
        expect(head.some((value) => value !== 0)).toBe(true);
    });

    it('renders the campfire crackles without NaN, audible and under full scale', () =>
    {
        const track = renderCrackles(createSeededRandom(7));
        for (const channel of track.channels)
        {
            expect(channel.every((value) => Number.isFinite(value) && Math.abs(value) <= 0.9 + 1e-6)).toBe(true);
            expect(rms(channel)).toBeGreaterThan(0.001);
        }
    });
});
