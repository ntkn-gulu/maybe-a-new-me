import type { AmbientLayerId } from '../core/ambient_mix';
import { seamLoop } from './ambient_dsp';

// Recorded ambience: field recordings (CC0, BigSoundBank) prepared by
// tools/prepare_ambient_audio.py into public/audio/ambient/<layer>.m4a.
// A file is downloaded the first time its layer plays (then the service
// worker keeps it for offline use), decoded once and kept as an AudioBuffer.
// Each file holds AMBIENT_SEAM_SECONDS more than its loop: that tail is
// crossfaded into the start, so the buffer loops with no gap and no click
// (an <audio loop> on iOS stops for a moment at every turn).

// Must match LOOP_SEAM_SECONDS in tools/prepare_ambient_audio.py
const AMBIENT_SEAM_SECONDS = 2;

// AAC can end on a few padding samples; they are dropped before the seam
const END_PADDING_SECONDS = 0.05;

// Decoding happens at this rate (the files' own rate): a 90 s stereo loop
// takes about 23 MB of memory instead of 35 MB at 48 kHz
const DECODE_RATE = 32_000;

export const AMBIENT_FILE_LAYERS: readonly AmbientLayerId[] = [
    'rain', 'waves', 'thunderstorm', 'night_train', 'night_field', 'creek', 'countryside', 'cafe',
];

const loading = new Map<AmbientLayerId, Promise<AudioBuffer>>();

export function isFileLayer(layer: AmbientLayerId): boolean
{
    return AMBIENT_FILE_LAYERS.includes(layer);
}

function getFileUrl(layer: AmbientLayerId): string
{
    return `${import.meta.env.BASE_URL}audio/ambient/${layer}.m4a`;
}

// Join the extra tail onto the start of every channel
function makeSeamless(decoded: AudioBuffer): AudioBuffer
{
    const fade = Math.floor(AMBIENT_SEAM_SECONDS * decoded.sampleRate);
    const usable = decoded.length - Math.floor(END_PADDING_SECONDS * decoded.sampleRate);
    const length = usable - fade;
    const looped = new AudioBuffer({ length, numberOfChannels: decoded.numberOfChannels, sampleRate: decoded.sampleRate });
    for (let channel = 0; channel < decoded.numberOfChannels; channel++)
    {
        const raw = new Float32Array(usable);
        decoded.copyFromChannel(raw, channel);
        looped.copyToChannel(seamLoop(raw, length, fade), channel);
    }
    return looped;
}

async function fetchLoop(layer: AmbientLayerId): Promise<AudioBuffer>
{
    const response = await fetch(getFileUrl(layer));
    if (!response.ok)
    {
        throw new Error(`ambient file ${layer}: ${response.status}`);
    }
    const data = await response.arrayBuffer();
    // An offline context decodes without touching the live one (and works before any tap)
    const decoder = new OfflineAudioContext(2, 1, DECODE_RATE);
    return makeSeamless(await decoder.decodeAudioData(data));
}

// The layer's seamless loop. Loaded once; a failed load (offline before the
// first play) is forgotten so the next try downloads again.
export function loadAmbientFile(layer: AmbientLayerId): Promise<AudioBuffer>
{
    let promise = loading.get(layer);
    if (!promise)
    {
        promise = fetchLoop(layer);
        loading.set(layer, promise);
        promise.catch(() => loading.delete(layer));
    }
    return promise;
}
