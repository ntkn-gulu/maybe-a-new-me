import { buildPackRecipes, DEFAULT_SOUND_PACK, type NoiseOptions, type SoundPack, type ToneOptions } from './sound_packs';
import { getContext, getMasterGain, getNoiseBuffer, isBackgroundPlaybackActive, setMasterVolume, unlockAudio } from './audio_context';

export { isAudioStale, setBackgroundPlaybackActive, unlockAudio } from './audio_context';

// Synthesized UI sounds built with the Web Audio API.
// No audio files: every sound is generated from oscillators and noise,
// so there is nothing to download and no licensing to worry about.
// The equipped sound pack (sound_packs.ts) swaps the everyday tap sounds.
// The context itself (iOS unlock, background, volume) is audio_context.ts;
// its tap/volume helpers are re-exported here for the rest of the app.

export type SfxName = 'press' | 'release' | 'tab' | 'toggle' | 'chime' | 'tick' | 'whoosh' | 'sparkle' | 'crack' | 'rise' | 'burst' | 'needle' | 'lift';

let is_enabled = true;
let current_volume = 0.8;
let loudness = 1;                     // per-call multiplier set by playSfx (e.g. escalating alarms)
let sound_pack: SoundPack = DEFAULT_SOUND_PACK;

export function setSfxVolume(volume: number): void
{
    current_volume = Math.min(1, Math.max(0, volume));
    setMasterVolume(current_volume);
}

export function setSfxEnabled(enabled: boolean): void
{
    is_enabled = enabled;
}

export function setSoundPack(pack: SoundPack): void
{
    sound_pack = pack;
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

    oscillator.connect(envelope).connect(getMasterGain());
    oscillator.start(start_time);
    oscillator.stop(end_time + 0.02);
}

function playNoise(options: NoiseOptions): void
{
    const context = getContext();
    const start_time = context.currentTime + (options.delay ?? 0);
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

    source.connect(filter).connect(envelope).connect(getMasterGain());
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
    // The stylus lands on a record: a soft low bump and a little dusty crackle
    needle: () =>
    {
        playTone({ start_hz: 90, end_hz: 60, duration: 0.12, peak: 0.3, wave: 'sine' });
        playNoise({ duration: 0.05, peak: 0.12, filter_hz: 3200, q: 1.5 });
        playNoise({ duration: 0.03, peak: 0.08, filter_hz: 4500, q: 2, delay: 0.09 });
        playNoise({ duration: 0.02, peak: 0.06, filter_hz: 3800, q: 2, delay: 0.17 });
    },
    // The tonearm lifts off: a short soft click going up
    lift: () =>
    {
        playNoise({ duration: 0.03, peak: 0.1, filter_hz: 2600, q: 2 });
        playTone({ start_hz: 300, end_hz: 520, duration: 0.08, peak: 0.08, wave: 'triangle' });
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

const PACK_RECIPES = buildPackRecipes({ playTone, playNoise });

// `loudness_scale` > 1 makes a sound louder than normal (used by alarms that escalate).
// `pack` plays the sound from another pack than the equipped one (Collection preview).
export function playSfx(name: SfxName, loudness_scale = 1, pack: SoundPack = sound_pack): void
{
    if (!is_enabled || current_volume === 0)
    {
        return;
    }
    // A delayed sound firing after the user left (e.g. the 2nd time-up ring)
    // would reopen the audio session and bring back the "playing" indicator
    if (document.visibilityState === 'hidden' && !isBackgroundPlaybackActive())
    {
        return;
    }
    unlockAudio();
    loudness = loudness_scale;
    const recipe = pack === 'classic' ? SFX_RECIPES[name] : PACK_RECIPES[pack][name] ?? SFX_RECIPES[name];
    recipe();
    loudness = 1;
}
