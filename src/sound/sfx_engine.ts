// Synthesized UI sounds built with the Web Audio API.
// No audio files: every sound is generated from oscillators and noise,
// so there is nothing to download and no licensing to worry about.

export type SfxName = 'press' | 'release' | 'tab' | 'toggle' | 'chime' | 'tick' | 'whoosh' | 'sparkle' | 'crack' | 'rise' | 'burst';

interface AudioSessionLike
{
    type: string;
}

const NOISE_BUFFER_SECONDS = 0.5;

// If the context is still not running this long after resume(), treat it as stuck
const RESUME_TIMEOUT_MS = 400;

let audio_context: AudioContext | null = null;
let master_gain: GainNode | null = null;
let noise_buffer: AudioBuffer | null = null;
let current_volume = 0.8;
let is_enabled = true;
let needs_rebuild = false;     // set when resume() failed: next tap builds a fresh context
let loudness = 1;             // per-call multiplier set by playSfx (e.g. escalating alarms)

// Safari 17+ exposes navigator.audioSession. "playback" lets sounds play
// even when the iPhone silent switch is on (needed for focus alarms).
function preferPlaybackSession(): void
{
    const audio_session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
    if (audio_session)
    {
        audio_session.type = 'playback';
    }
}

function getContext(): AudioContext
{
    if (!audio_context)
    {
        preferPlaybackSession();
        audio_context = new AudioContext();
        master_gain = audio_context.createGain();
        master_gain.gain.value = current_volume;
        master_gain.connect(audio_context.destination);
    }
    return audio_context;
}

function getNoiseBuffer(context: AudioContext): AudioBuffer
{
    if (!noise_buffer)
    {
        const frame_count = Math.floor(context.sampleRate * NOISE_BUFFER_SECONDS);
        noise_buffer = context.createBuffer(1, frame_count, context.sampleRate);
        const samples = noise_buffer.getChannelData(0);
        for (let i = 0; i < frame_count; i++)
        {
            samples[i] = Math.random() * 2 - 1;
        }
    }
    return noise_buffer;
}

// Throw away the current context and start a new one. Must run inside a
// user tap so iOS lets the new context start in the "running" state.
function rebuildContext(): void
{
    if (audio_context && audio_context.state !== 'closed')
    {
        void audio_context.close();
    }
    audio_context = null;
    master_gain = null;
    noise_buffer = null;
    needs_rebuild = false;
    getContext();
}

// Ask a non-running context to start again. iOS Safari also has an
// "interrupted" state (screenshot shutter, phone call, another app's audio),
// so anything other than "running" gets a resume. If that does not work
// in time, the next tap rebuilds the context.
function tryResume(context: AudioContext): void
{
    void context.resume().catch(() =>
    {
        needs_rebuild = true;
    });
    window.setTimeout(() =>
    {
        if (audio_context === context && context.state !== 'running')
        {
            needs_rebuild = true;
        }
    }, RESUME_TIMEOUT_MS);
    // Note: a successful resume does NOT clear needs_rebuild, because iOS can
    // report "running" while silent. Only a rebuild inside a tap clears it.
}

// True while handling a real tap/click. A brand-new context only starts
// "running" on iOS when it is created inside one. Browsers without the
// UserActivation API are assumed to be in a gesture (sounds come from taps).
function isInUserGesture(): boolean
{
    const user_activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
    return user_activation ? user_activation.isActive : true;
}

// iOS keeps audio locked until a user gesture: call this from a tap.
export function unlockAudio(): void
{
    const wants_rebuild = needs_rebuild || audio_context?.state === 'closed';
    if (wants_rebuild && isInUserGesture())
    {
        rebuildContext();
    }
    const context = getContext();
    if (context.state !== 'running')
    {
        tryResume(context);
    }
}

// True when sound may be silent until the next tap (after the app was in the background)
export function isAudioStale(): boolean
{
    return needs_rebuild;
}

// Known iOS bug: after the app goes to the background and comes back, the
// context can report "running" yet play nothing. So every return from the
// background marks it stale; the next tap builds a fresh one. Meanwhile we
// still try a resume in case the old context is fine.
document.addEventListener('visibilitychange', () =>
{
    if (document.visibilityState === 'visible' && audio_context)
    {
        needs_rebuild = true;
        tryResume(audio_context);
    }
});

export function setSfxVolume(volume: number): void
{
    current_volume = Math.min(1, Math.max(0, volume));
    if (master_gain)
    {
        master_gain.gain.value = current_volume;
    }
}

export function setSfxEnabled(enabled: boolean): void
{
    is_enabled = enabled;
}

interface ToneOptions
{
    start_hz: number;
    end_hz: number;
    duration: number;      // seconds
    peak: number;          // 0..1 loudness before master volume
    wave: OscillatorType;
    delay?: number;        // seconds from now
}

function playTone(options: ToneOptions): void
{
    const context = getContext();
    const start_time = context.currentTime + (options.delay ?? 0);
    const end_time = start_time + options.duration;

    const oscillator = context.createOscillator();
    oscillator.type = options.wave;
    oscillator.frequency.setValueAtTime(options.start_hz, start_time);
    oscillator.frequency.exponentialRampToValueAtTime(options.end_hz, end_time);

    // Fast attack + exponential decay = a natural "plucked" envelope
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start_time);
    envelope.gain.exponentialRampToValueAtTime(options.peak * loudness, start_time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end_time);

    oscillator.connect(envelope).connect(master_gain!);
    oscillator.start(start_time);
    oscillator.stop(end_time + 0.02);
}

interface NoiseOptions
{
    duration: number;      // seconds
    peak: number;          // 0..1 loudness before master volume
    filter_hz: number;     // band-pass center: low = thud, high = click
    q: number;             // band-pass sharpness
}

function playNoise(options: NoiseOptions): void
{
    const context = getContext();
    const start_time = context.currentTime;
    const end_time = start_time + options.duration;

    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer(context);

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = options.filter_hz;
    filter.Q.value = options.q;

    const envelope = context.createGain();
    envelope.gain.setValueAtTime(options.peak * loudness, start_time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end_time);

    source.connect(filter).connect(envelope).connect(master_gain!);
    source.start(start_time);
    source.stop(end_time + 0.02);
}

// Each sound is a small recipe of tones and noise bursts.
const SFX_RECIPES: Record<SfxName, () => void> = {
    // Button goes down: soft low thump + tiny contact click
    press: () =>
    {
        playTone({ start_hz: 210, end_hz: 90, duration: 0.07, peak: 0.5, wave: 'sine' });
        playNoise({ duration: 0.025, peak: 0.25, filter_hz: 2600, q: 1.2 });
    },
    // Button springs back: short bright tick
    release: () =>
    {
        playNoise({ duration: 0.018, peak: 0.18, filter_hz: 4200, q: 2 });
        playTone({ start_hz: 1400, end_hz: 1100, duration: 0.03, peak: 0.08, wave: 'triangle' });
    },
    // Tab switch: wooden "tok"
    tab: () =>
    {
        playTone({ start_hz: 620, end_hz: 380, duration: 0.06, peak: 0.28, wave: 'triangle' });
        playNoise({ duration: 0.02, peak: 0.12, filter_hz: 1800, q: 3 });
    },
    // Switch flip: two quick ticks
    toggle: () =>
    {
        playNoise({ duration: 0.015, peak: 0.2, filter_hz: 3200, q: 2 });
        playTone({ start_hz: 900, end_hz: 700, duration: 0.04, peak: 0.12, wave: 'square', delay: 0.035 });
    },
    // Typewriter key: very short, quiet, slightly random pitch
    tick: () =>
    {
        playNoise({ duration: 0.012, peak: 0.07, filter_hz: 3000 + Math.random() * 1500, q: 4 });
    },
    // Air sweep: filtered noise rising in pitch (things flying in)
    whoosh: () =>
    {
        playNoise({ duration: 0.35, peak: 0.12, filter_hz: 900, q: 0.7 });
        playTone({ start_hz: 300, end_hz: 900, duration: 0.3, peak: 0.05, wave: 'sine' });
    },
    // Rising arpeggio: something good happened
    sparkle: () =>
    {
        const NOTES_HZ = [1046, 1318, 1568, 2093];
        NOTES_HZ.forEach((hz, index) =>
        {
            playTone({ start_hz: hz, end_hz: hz, duration: 0.35, peak: 0.12, wave: 'triangle', delay: index * 0.06 });
        });
    },
    // Something snaps: sharp noise crack, then a low thud and a falling tone
    crack: () =>
    {
        playNoise({ duration: 0.09, peak: 0.55, filter_hz: 2400, q: 0.9 });
        playTone({ start_hz: 140, end_hz: 55, duration: 0.35, peak: 0.45, wave: 'sine' });
        playTone({ start_hz: 620, end_hz: 180, duration: 0.4, peak: 0.12, wave: 'sawtooth', delay: 0.05 });
    },
    // Level-up charge: pentatonic notes climbing faster and louder (~1 s)
    rise: () =>
    {
        const NOTES_HZ = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 1046];
        let delay = 0;
        NOTES_HZ.forEach((hz, index) =>
        {
            const progress = index / (NOTES_HZ.length - 1);
            playTone({ start_hz: hz, end_hz: hz * 1.01, duration: 0.16, peak: 0.06 + progress * 0.14, wave: 'triangle', delay });
            delay += 0.13 - progress * 0.07;          // gaps shrink: the climb speeds up
        });
        playNoise({ duration: 1.1, peak: 0.05, filter_hz: 1400, q: 0.6 });
    },
    // Level-up release: deep boom, bright crack and a major chord ringing out
    burst: () =>
    {
        playNoise({ duration: 0.5, peak: 0.5, filter_hz: 180, q: 0.7 });
        playNoise({ duration: 0.12, peak: 0.35, filter_hz: 3600, q: 1 });
        playTone({ start_hz: 110, end_hz: 45, duration: 0.6, peak: 0.45, wave: 'sine' });
        const CHORD_HZ = [523, 659, 784, 1046];
        CHORD_HZ.forEach((hz, index) =>
        {
            playTone({ start_hz: hz, end_hz: hz, duration: 1.4, peak: 0.1, wave: 'triangle', delay: 0.05 + index * 0.025 });
        });
    },
    // Soft bell: fundamental + inharmonic partials, long decay
    chime: () =>
    {
        playTone({ start_hz: 880, end_hz: 878, duration: 1.6, peak: 0.35, wave: 'sine' });
        playTone({ start_hz: 1320, end_hz: 1316, duration: 1.1, peak: 0.16, wave: 'sine' });
        playTone({ start_hz: 2390, end_hz: 2380, duration: 0.6, peak: 0.06, wave: 'sine' });
        playTone({ start_hz: 1175, end_hz: 1173, duration: 1.4, peak: 0.22, wave: 'sine', delay: 0.18 });
    },
};

// `loudness_scale` > 1 makes a sound louder than normal (used by alarms that escalate)
export function playSfx(name: SfxName, loudness_scale = 1): void
{
    if (!is_enabled || current_volume === 0)
    {
        return;
    }
    unlockAudio();
    loudness = loudness_scale;
    SFX_RECIPES[name]();
    loudness = 1;
}
