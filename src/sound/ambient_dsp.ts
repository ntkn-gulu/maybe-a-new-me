import type { RandomFn } from '../core/types';

// Sample-level helpers that pre-render ambient loops in plain JavaScript.
// A pre-rendered loop plays as one looping buffer: no timers, so it keeps
// going when the phone is locked, and the loop point is seamless (gapless,
// unlike <audio loop> on iOS). Events (crackles, pops) are written with
// wrap-around, so one that starts near the end finishes at the start.

export interface Track
{
    rate: number;                           // samples per second
    length: number;                         // samples per channel
    channels: Float32Array<ArrayBuffer>[];  // 1 (mono) or 2 (left, right)
}

export type NoiseColor = 'white' | 'pink' | 'brown';

const TWO_PI = Math.PI * 2;

// Crossfade length used to join the end of a noise bed onto its start
const SEAM_SECONDS = 0.25;

export function createTrack(seconds: number, rate: number, channel_count: 1 | 2 = 2): Track
{
    const length = Math.floor(seconds * rate);
    const channels = Array.from({ length: channel_count }, () => new Float32Array(length));
    return { rate, length, channels };
}

// AudioBuffers are not tied to one AudioContext, so a rendered loop is kept
// and reused even after iOS forces the app to build a new context
export function toAudioBuffer(track: Track): AudioBuffer
{
    const buffer = new AudioBuffer({ length: track.length, numberOfChannels: track.channels.length, sampleRate: track.rate });
    track.channels.forEach((data, index) => buffer.copyToChannel(data, index));
    return buffer;
}

// Equal-power stereo gains for a pan in -1 (left) .. 1 (right)
export function panGains(pan: number): [number, number]
{
    const angle = (pan + 1) * Math.PI / 4;
    return [Math.cos(angle), Math.sin(angle)];
}

export function randomBetween(random: RandomFn, low: number, high: number): number
{
    return low + random() * (high - low);
}

// Uniform on a log scale: as many low pitches as high ones, the way ears hear them
export function randomLogBetween(random: RandomFn, low: number, high: number): number
{
    return low * Math.pow(high / low, random());
}

// Seconds until the next event of a random (Poisson) stream with `rate_per_second`
export function nextEventGap(random: RandomFn, rate_per_second: number): number
{
    return -Math.log(1 - random()) / rate_per_second;
}

// One-pole low-pass smoothing factor for a cutoff
export function onePoleFactor(cutoff_hz: number, rate: number): number
{
    return 1 - Math.exp(-TWO_PI * cutoff_hz / rate);
}

// ---- Noise beds -------------------------------------------------------------

function fillNoise(samples: Float32Array, color: NoiseColor, random: RandomFn): void
{
    // Pink: Paul Kellet's filter bank. Brown: leaky integrated white noise.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    let brown = 0;
    for (let i = 0; i < samples.length; i++)
    {
        const white = random() * 2 - 1;
        if (color === 'white')
        {
            samples[i] = white;
        }
        else if (color === 'pink')
        {
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            samples[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
        }
        else
        {
            brown = (brown + 0.02 * white) / 1.02;
            samples[i] = brown;
        }
    }
}

// Scale so the loudness (RMS) is `target_rms`: every color sits at the same level
function normalizeRms(samples: Float32Array, target_rms: number): void
{
    let sum = 0;
    for (let i = 0; i < samples.length; i++)
    {
        sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    if (rms === 0)
    {
        return;
    }
    const scale = target_rms / rms;
    for (let i = 0; i < samples.length; i++)
    {
        samples[i] *= scale;
    }
}

// Scale a sparse rendered loop (crackles) so its loudest sample is `target_peak`
export function normalizePeak(track: Track, target_peak: number): void
{
    let peak = 0;
    for (const channel of track.channels)
    {
        for (let i = 0; i < channel.length; i++)
        {
            peak = Math.max(peak, Math.abs(channel[i]));
        }
    }
    if (peak === 0)
    {
        return;
    }
    const scale = target_peak / peak;
    for (const channel of track.channels)
    {
        for (let i = 0; i < channel.length; i++)
        {
            channel[i] *= scale;
        }
    }
}

// Join a sound rendered `fade` samples too long into a seamless loop of
// `length`: the extra tail is crossfaded into the start, so the last sample
// flows straight into the first one
export function seamLoop(raw: Float32Array<ArrayBuffer>, length: number, fade: number): Float32Array<ArrayBuffer>
{
    const looped = raw.slice(0, length);
    for (let i = 0; i < fade; i++)
    {
        const angle = (i / fade) * Math.PI / 2;
        looped[i] = raw[i] * Math.sin(angle) + raw[length + i] * Math.cos(angle);
    }
    return looped;
}

// A seamless stereo noise loop (left and right differ, so it sounds wide)
export function renderNoiseLoop(color: NoiseColor, seconds: number, rate: number, random: RandomFn): Track
{
    const track = createTrack(seconds, rate);
    const fade = Math.floor(SEAM_SECONDS * rate);
    track.channels = track.channels.map(() =>
    {
        const raw = new Float32Array(track.length + fade);
        fillNoise(raw, color, random);
        normalizeRms(raw, 0.25);
        return seamLoop(raw, track.length, fade);
    });
    return track;
}

// ---- Events -----------------------------------------------------------------

export interface PingOptions
{
    hz: number;                         // start pitch
    end_hz?: number;                    // pitch at the end of the decay (glides exponentially)
    decay: number;                      // seconds to fade to silence
    attack?: number;                    // seconds to reach full volume
    gain: number;
    pan?: number;                       // -1 .. 1
}

// A decaying sine with an optional pitch glide: the ring of a wood pop
export function addPing(track: Track, start: number, options: PingOptions): void
{
    const rate = track.rate;
    const count = Math.floor(options.decay * rate);
    const attack = Math.max(1, Math.floor((options.attack ?? 0.002) * rate));
    const end_hz = options.end_hz ?? options.hz;
    const glide = Math.pow(end_hz / options.hz, 1 / count);
    const [left_gain, right_gain] = panGains(options.pan ?? 0);
    const decay_per_sample = Math.pow(0.001, 1 / count);       // -60 dB at the end
    const first = Math.floor(start * rate);
    let phase = 0;
    let hz = options.hz;
    let envelope = options.gain;
    for (let i = 0; i < count; i++)
    {
        const ramp = i < attack ? i / attack : 1;
        const value = Math.sin(phase) * envelope * ramp;
        writeSample(track, first + i, value * left_gain, value * right_gain);
        phase += TWO_PI * hz / rate;
        hz *= glide;
        envelope *= decay_per_sample;
    }
}

export interface BurstOptions
{
    decay: number;                      // seconds to fade to silence
    attack?: number;
    gain: number;
    pan?: number;
    lowpass_hz?: number;                // darker
    highpass_hz?: number;               // thinner
}

// A short burst of filtered noise: a crackle, a click, a thump, a crash
export function addBurst(track: Track, start: number, options: BurstOptions, random: RandomFn): void
{
    const rate = track.rate;
    const count = Math.floor(options.decay * rate);
    const attack = Math.max(1, Math.floor((options.attack ?? 0) * rate));
    const [left_gain, right_gain] = panGains(options.pan ?? 0);
    const low_factor = options.lowpass_hz ? onePoleFactor(options.lowpass_hz, rate) : 1;
    const high_factor = options.highpass_hz ? onePoleFactor(options.highpass_hz, rate) : 0;
    const decay_per_sample = Math.pow(0.001, 1 / count);
    const first = Math.floor(start * rate);
    let low = 0;
    let high_base = 0;
    let envelope = options.gain;
    for (let i = 0; i < count; i++)
    {
        low += (random() * 2 - 1 - low) * low_factor;
        high_base += (low - high_base) * high_factor;
        const ramp = i < attack ? i / attack : 1;
        const value = (low - high_base) * envelope * ramp;
        writeSample(track, first + i, value * left_gain, value * right_gain);
        envelope *= decay_per_sample;
    }
}

// Add one stereo sample, wrapping past the end back to the start
export function writeSample(track: Track, index: number, left: number, right: number): void
{
    const at = index % track.length;
    track.channels[0][at] += left;
    if (track.channels.length > 1)
    {
        track.channels[1][at] += right;
    }
}
