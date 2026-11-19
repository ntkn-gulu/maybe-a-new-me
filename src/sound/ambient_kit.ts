import { createSeededRandom } from '../core/rng';
import type { RandomFn } from '../core/types';
import { renderNoiseLoop, toAudioBuffer, type NoiseColor, type Track } from './ambient_dsp';

// Building blocks for a live ambient layer: looping noise beds through
// filters, pre-rendered loops, and slow LFOs that make things breathe
// (gusts, swells, flicker). Everything runs inside the audio graph, with no
// JavaScript timers, so it keeps playing while the phone is locked.

export interface LayerKit
{
    context: AudioContext;
    output: AudioNode;                          // the layer's own gain (level + fades)
    sources: AudioScheduledSourceNode[];        // everything to stop when the layer ends
    random: RandomFn;
    is_stopped: boolean;                        // set by stopKit: a file that arrives later must not start
}

export interface FilterSpec
{
    type: BiquadFilterType;
    hz: number;
    q?: number;
}

export interface Voice
{
    gain: GainNode;
    filters: BiquadFilterNode[];
}

// Noise beds and rendered loops are made once and kept (AudioBuffers work in any context)
const NOISE_SECONDS = 6;
const NOISE_RATE = 32_000;
const NOISE_SEEDS: Record<NoiseColor, number> = { white: 11, pink: 23, brown: 37 };
const buffer_cache = new Map<string, AudioBuffer>();

export function getCachedBuffer(key: string, render: () => Track): AudioBuffer
{
    let buffer = buffer_cache.get(key);
    if (!buffer)
    {
        buffer = toAudioBuffer(render());
        buffer_cache.set(key, buffer);
    }
    return buffer;
}

function getNoiseLoop(color: NoiseColor): AudioBuffer
{
    return getCachedBuffer(`noise_${color}`, () => renderNoiseLoop(color, NOISE_SECONDS, NOISE_RATE, createSeededRandom(NOISE_SEEDS[color])));
}

export function prewarmNoise(): void
{
    (['white', 'pink', 'brown'] as const).forEach(getNoiseLoop);
}

export function createKit(context: AudioContext, output: AudioNode, seed: number): LayerKit
{
    return { context, output, sources: [], random: createSeededRandom(seed), is_stopped: false };
}

// Start a looping buffer at a random point, so two voices on the same
// buffer never line up (that would sound hollow)
function startLoop(kit: LayerKit, buffer: AudioBuffer, destination: AudioNode, playback_rate = 1): AudioBufferSourceNode
{
    const source = kit.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = playback_rate;
    source.connect(destination);
    source.start(kit.context.currentTime, kit.random() * buffer.duration);
    kit.sources.push(source);
    return source;
}

function chainFilters(kit: LayerKit, specs: FilterSpec[], last: AudioNode): { first: AudioNode; filters: BiquadFilterNode[] }
{
    const filters = specs.map((spec) =>
    {
        const filter = kit.context.createBiquadFilter();
        filter.type = spec.type;
        filter.frequency.value = spec.hz;
        filter.Q.value = spec.q ?? 0.7;
        return filter;
    });
    let next: AudioNode = last;
    for (let i = filters.length - 1; i >= 0; i--)
    {
        filters[i].connect(next);
        next = filters[i];
    }
    return { first: next, filters };
}

function createVoiceGain(kit: LayerKit, gain: number, pan?: number): GainNode
{
    const voice_gain = kit.context.createGain();
    voice_gain.gain.value = gain;
    if (pan === undefined)
    {
        voice_gain.connect(kit.output);
    }
    else
    {
        const panner = kit.context.createStereoPanner();
        panner.pan.value = pan;
        voice_gain.connect(panner).connect(kit.output);
    }
    return voice_gain;
}

// A noise bed: noise of a color -> filters -> gain (-> pan) -> the layer
export function addNoise(kit: LayerKit, color: NoiseColor, gain: number, filters: FilterSpec[] = [], pan?: number): Voice
{
    const voice_gain = createVoiceGain(kit, gain, pan);
    const chain = chainFilters(kit, filters, voice_gain);
    startLoop(kit, getNoiseLoop(color), chain.first);
    return { gain: voice_gain, filters: chain.filters };
}

// A loop (rendered or recorded): buffer -> filters -> gain -> the layer
export function addLoop(kit: LayerKit, buffer: AudioBuffer, gain: number, filters: FilterSpec[] = []): Voice
{
    const voice_gain = createVoiceGain(kit, gain);
    const chain = chainFilters(kit, filters, voice_gain);
    startLoop(kit, buffer, chain.first);
    return { gain: voice_gain, filters: chain.filters };
}

// Slowly move a parameter around its current value: value ± depth, `rate_hz` times a second
export function addLfo(kit: LayerKit, param: AudioParam, rate_hz: number, depth: number): void
{
    const oscillator = kit.context.createOscillator();
    oscillator.frequency.value = rate_hz;
    const depth_gain = kit.context.createGain();
    depth_gain.gain.value = depth;
    oscillator.connect(depth_gain).connect(param);
    oscillator.start(kit.context.currentTime + kit.random() * 2);
    kit.sources.push(oscillator);
}

// Two LFOs at unrelated rates on one parameter: a drift that never repeats the same way
export function addDrift(kit: LayerKit, param: AudioParam, depth: number, slow_hz: number): void
{
    addLfo(kit, param, slow_hz, depth * 0.6);
    addLfo(kit, param, slow_hz * 2.71, depth * 0.4);
}

export function stopKit(kit: LayerKit, at_time: number): void
{
    kit.is_stopped = true;
    for (const source of kit.sources)
    {
        try
        {
            source.stop(at_time);
        }
        catch
        {
            // already stopped
        }
    }
}
