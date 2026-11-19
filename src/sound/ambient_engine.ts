import type { AmbientLayerId } from '../core/ambient_mix';
import { getContext, onContextChanged, setBackgroundPlaybackActive } from './audio_context';
import { createKit, stopKit, type LayerKit } from './ambient_kit';
import { AMBIENT_RECIPES } from './ambient_layers';

// Plays the ambient mix. The store hands over the wanted state (which
// layers at which level, playing or paused, volume) and the engine moves
// the live audio there with fades: a layer fades in when switched on and
// out before it stops, and a level change glides instead of jumping.
// Ambient has its own bus (not the UI sound volume) with a gentle
// compressor so several loud layers together never clip.

export interface AmbientTarget
{
    levels: Partial<Record<AmbientLayerId, number>>;    // playing layers only
    is_playing: boolean;
    volume: number;                                     // 0..1, the whole mix
}

interface LiveLayer
{
    kit: LayerKit;
    gain: GainNode;
    is_ready: boolean;                  // built (a recorded layer may still be downloading)
}

const FADE_IN_SECONDS = 1.6;
const FADE_OUT_SECONDS = 0.9;
const LEVEL_GLIDE_SECONDS = 0.12;

let target: AmbientTarget = { levels: {}, is_playing: false, volume: 0.8 };
let bus: GainNode | null = null;
let bus_context: AudioContext | null = null;
const live_layers = new Map<AmbientLayerId, LiveLayer>();
let layer_seed = 1;

// Ears hear loudness on a curve: squaring the slider feels even all the way
function toGain(level: number): number
{
    return level * level;
}

function getBus(context: AudioContext): GainNode
{
    if (!bus || bus_context !== context)
    {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.01;
        compressor.release.value = 0.4;
        compressor.connect(context.destination);
        bus = context.createGain();
        bus.gain.value = toGain(target.volume);
        bus.connect(compressor);
        bus_context = context;
    }
    return bus;
}

function glide(param: AudioParam, value: number, seconds: number): void
{
    const now = param.value;
    const context_time = (bus_context as AudioContext).currentTime;
    param.cancelScheduledValues(context_time);
    param.setValueAtTime(now, context_time);
    param.linearRampToValueAtTime(value, context_time + seconds);
}

// Build a layer silent, then fade it in once its recipe is done (right
// away for synthesized layers, after the download for recorded ones). A
// layer that failed to load stays silent; turning it off and on retries.
function startLayer(context: AudioContext, layer: AmbientLayerId): void
{
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(getBus(context));
    const kit = createKit(context, gain, layer_seed++);
    const live: LiveLayer = { kit, gain, is_ready: false };
    live_layers.set(layer, live);
    void Promise.resolve(AMBIENT_RECIPES[layer](kit))
        .then(() =>
        {
            if (live_layers.get(layer) !== live)
            {
                return;
            }
            live.is_ready = true;
            glide(gain.gain, toGain(target.levels[layer] ?? 0), FADE_IN_SECONDS);
        })
        .catch(() => undefined);
}

function stopLayer(layer: AmbientLayerId): void
{
    const live = live_layers.get(layer);
    if (!live)
    {
        return;
    }
    live_layers.delete(layer);
    glide(live.gain.gain, 0, FADE_OUT_SECONDS);
    stopKit(live.kit, live.kit.context.currentTime + FADE_OUT_SECONDS + 0.05);
}

// Move the live audio to the target
function reconcile(): void
{
    const wanted = target.is_playing ? target.levels : {};
    const wanted_layers = Object.keys(wanted) as AmbientLayerId[];
    for (const layer of [...live_layers.keys()])
    {
        if (!wanted_layers.includes(layer))
        {
            stopLayer(layer);
        }
    }
    if (wanted_layers.length === 0)
    {
        setBackgroundPlaybackActive(false);
        return;
    }
    setBackgroundPlaybackActive(true);
    const context = getContext();
    glide(getBus(context).gain, toGain(target.volume), LEVEL_GLIDE_SECONDS);
    for (const layer of wanted_layers)
    {
        const level = wanted[layer] ?? 0;
        const live = live_layers.get(layer);
        if (!live)
        {
            startLayer(context, layer);
        }
        else if (live.is_ready)
        {
            glide(live.gain.gain, toGain(level), LEVEL_GLIDE_SECONDS);
        }
    }
}

export function setAmbientTarget(next: AmbientTarget): void
{
    target = next;
    reconcile();
}

// The context was replaced (iOS, after the app was in the background: this
// runs inside the tap that rebuilt it) or released (the app was left): the
// old nodes are gone. A visible app builds the layers again right away on
// the new context; a hidden one waits for the next target.
onContextChanged(() =>
{
    live_layers.clear();
    bus = null;
    bus_context = null;
    if (target.is_playing && document.visibilityState === 'visible')
    {
        reconcile();
    }
});
