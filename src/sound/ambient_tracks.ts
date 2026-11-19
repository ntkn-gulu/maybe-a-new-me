import type { RandomFn } from '../core/types';
import {
    addBurst,
    addPing,
    createTrack,
    nextEventGap,
    normalizePeak,
    randomBetween,
    randomLogBetween,
    type Track,
} from './ambient_dsp';

// The one event loop still made in code: campfire crackles (recordings of
// a fire tend to carry wind and voices; clean crackles synthesize well).

// Campfire: clusters of sharp crackles, wood pops, sap hissing, a log settling
export function renderCrackles(random: RandomFn): Track
{
    const seconds = 29;
    const track = createTrack(seconds, 32_000);
    let time = 0;
    while ((time += nextEventGap(random, 4.5)) < seconds)
    {
        const cluster_pan = randomBetween(random, -0.6, 0.6);
        const clicks = 1 + Math.floor(random() * random() * 7);
        for (let i = 0; i < clicks; i++)
        {
            const loudness = random();
            addBurst(track, time + random() * 0.06, {
                decay: randomBetween(random, 0.0006, 0.003),
                gain: 0.15 + 0.85 * loudness * loudness * loudness,
                pan: cluster_pan + randomBetween(random, -0.15, 0.15),
                highpass_hz: 700,
                lowpass_hz: randomLogBetween(random, 2500, 12_000),
            }, random);
        }
    }
    time = 0;
    while ((time += nextEventGap(random, 0.5)) < seconds)
    {
        const pan = randomBetween(random, -0.5, 0.5);
        addBurst(track, time, { decay: randomBetween(random, 0.01, 0.025), gain: 0.7, pan, lowpass_hz: 2500, highpass_hz: 200 }, random);
        const hz = randomLogBetween(random, 250, 700);
        addPing(track, time, { hz, end_hz: hz * 0.7, decay: 0.035, gain: 0.12, pan });
    }
    time = 0;
    while ((time += nextEventGap(random, 0.08)) < seconds)
    {
        addBurst(track, time, { attack: 0.4, decay: 1.6, gain: 0.08, pan: randomBetween(random, -0.4, 0.4), highpass_hz: 2500 }, random);
    }
    time = 0;
    while ((time += nextEventGap(random, 0.05)) < seconds)
    {
        addBurst(track, time, { decay: 0.18, gain: 0.5, lowpass_hz: 320 }, random);
    }
    normalizePeak(track, 0.9);
    return track;
}
