import type { SfxName } from './sfx_engine';

// Sound packs (Collection items): each one replaces the everyday tap sounds
// (press, release, tab, toggle, tick) and the small "something good" sound
// (sparkle) with its own recipes. Big moments (crack, rise, burst, chime,
// whoosh) keep the classic sounds in every pack.
// The recipes get the engine's tone / noise makers passed in, so this file
// has no audio state of its own.

export type SoundPack = 'classic' | 'mechanical' | 'wood' | 'retro' | 'wind_chime';

export const DEFAULT_SOUND_PACK: SoundPack = 'classic';

const SOUND_PACK_BY_ITEM: Record<string, SoundPack> = {
    sound_classic: 'classic',
    sound_mechanical: 'mechanical',
    sound_wood: 'wood',
    sound_retro: 'retro',
    sound_wind_chime: 'wind_chime',
};

export function getSoundPackForItem(item_id: string): SoundPack
{
    return SOUND_PACK_BY_ITEM[item_id] ?? DEFAULT_SOUND_PACK;
}

export interface ToneOptions
{
    start_hz: number;
    end_hz: number;
    duration: number;      // seconds
    peak: number;          // 0..1 loudness before master volume
    wave: OscillatorType;
    delay?: number;        // seconds from now
}

export interface NoiseOptions
{
    duration: number;      // seconds
    peak: number;          // 0..1 loudness before master volume
    filter_hz: number;     // band-pass center: low = thud, high = click
    q: number;             // band-pass sharpness
    delay?: number;        // seconds from now
}

export interface SoundTools
{
    playTone: (options: ToneOptions) => void;
    playNoise: (options: NoiseOptions) => void;
}

export type PackRecipes = Partial<Record<SfxName, () => void>>;

// Notes of a major pentatonic scale (C6 up), for the wind chimes
const CHIME_NOTES_HZ = [1047, 1175, 1319, 1568, 1760, 2093];

function pick<T>(values: readonly T[]): T
{
    return values[Math.floor(Math.random() * values.length)];
}

// One wind-chime strike: a pure tone with two inharmonic partials, long ring
function chimeNote(tools: SoundTools, hz: number, peak: number, delay = 0): void
{
    tools.playTone({ start_hz: hz, end_hz: hz * 0.998, duration: 1.2, peak, wave: 'sine', delay });
    tools.playTone({ start_hz: hz * 2.76, end_hz: hz * 2.75, duration: 0.5, peak: peak * 0.25, wave: 'sine', delay });
    tools.playTone({ start_hz: hz * 5.4, end_hz: hz * 5.38, duration: 0.25, peak: peak * 0.08, wave: 'sine', delay });
}

export function buildPackRecipes(tools: SoundTools): Record<Exclude<SoundPack, 'classic'>, PackRecipes>
{
    const { playTone, playNoise } = tools;
    return {
        // Mechanical keyboard: a crisp switch click over a deep "thock"
        mechanical: {
            press: () =>
            {
                playNoise({ duration: 0.012, peak: 0.32, filter_hz: 5200, q: 3 });
                playNoise({ duration: 0.05, peak: 0.3, filter_hz: 420, q: 1.4, delay: 0.006 });
                playTone({ start_hz: 150, end_hz: 90, duration: 0.05, peak: 0.28, wave: 'sine', delay: 0.006 });
            },
            release: () =>
            {
                playNoise({ duration: 0.01, peak: 0.22, filter_hz: 6400, q: 3.5 });
                playNoise({ duration: 0.025, peak: 0.12, filter_hz: 900, q: 2, delay: 0.004 });
            },
            tab: () =>
            {
                playNoise({ duration: 0.012, peak: 0.26, filter_hz: 4800, q: 3 });
                playNoise({ duration: 0.04, peak: 0.22, filter_hz: 520, q: 1.6, delay: 0.005 });
                playNoise({ duration: 0.01, peak: 0.16, filter_hz: 6000, q: 3, delay: 0.06 });
            },
            toggle: () =>
            {
                playNoise({ duration: 0.012, peak: 0.28, filter_hz: 5600, q: 3 });
                playNoise({ duration: 0.012, peak: 0.24, filter_hz: 4200, q: 3, delay: 0.045 });
                playNoise({ duration: 0.04, peak: 0.18, filter_hz: 480, q: 1.5, delay: 0.05 });
            },
            tick: () =>
            {
                playNoise({ duration: 0.009, peak: 0.12, filter_hz: 4500 + Math.random() * 1800, q: 4 });
            },
            sparkle: () =>
            {
                // A quick typing run, then a bright ding (carriage return bell)
                [0, 0.05, 0.1, 0.15].forEach((delay) =>
                {
                    playNoise({ duration: 0.01, peak: 0.18, filter_hz: 5000 + Math.random() * 1500, q: 3, delay });
                });
                playTone({ start_hz: 2637, end_hz: 2630, duration: 0.6, peak: 0.12, wave: 'sine', delay: 0.24 });
            },
        },

        // Woodblocks: hollow knocks with a short band-passed body
        wood: {
            press: () =>
            {
                playTone({ start_hz: 520, end_hz: 470, duration: 0.07, peak: 0.36, wave: 'triangle' });
                playNoise({ duration: 0.03, peak: 0.2, filter_hz: 1100, q: 7 });
            },
            release: () =>
            {
                playTone({ start_hz: 880, end_hz: 820, duration: 0.05, peak: 0.18, wave: 'triangle' });
                playNoise({ duration: 0.018, peak: 0.1, filter_hz: 1900, q: 8 });
            },
            tab: () =>
            {
                playTone({ start_hz: 700, end_hz: 650, duration: 0.06, peak: 0.3, wave: 'triangle' });
                playNoise({ duration: 0.025, peak: 0.16, filter_hz: 1500, q: 8 });
                playTone({ start_hz: 1040, end_hz: 980, duration: 0.05, peak: 0.16, wave: 'triangle', delay: 0.07 });
            },
            toggle: () =>
            {
                // A little marimba note
                playTone({ start_hz: 784, end_hz: 782, duration: 0.25, peak: 0.26, wave: 'sine' });
                playTone({ start_hz: 3136, end_hz: 3130, duration: 0.05, peak: 0.05, wave: 'sine' });
            },
            tick: () =>
            {
                playNoise({ duration: 0.015, peak: 0.1, filter_hz: 1300 + Math.random() * 600, q: 9 });
            },
            sparkle: () =>
            {
                // Marimba run up a pentatonic scale
                [523, 659, 784, 1047].forEach((hz, index) =>
                {
                    playTone({ start_hz: hz, end_hz: hz, duration: 0.3, peak: 0.2, wave: 'sine', delay: index * 0.07 });
                    playTone({ start_hz: hz * 4, end_hz: hz * 4, duration: 0.05, peak: 0.04, wave: 'sine', delay: index * 0.07 });
                });
            },
        },

        // 8-bit console: square-wave blips
        retro: {
            press: () =>
            {
                playTone({ start_hz: 330, end_hz: 165, duration: 0.06, peak: 0.12, wave: 'square' });
            },
            release: () =>
            {
                playTone({ start_hz: 660, end_hz: 660, duration: 0.03, peak: 0.07, wave: 'square' });
            },
            tab: () =>
            {
                playTone({ start_hz: 523, end_hz: 523, duration: 0.04, peak: 0.1, wave: 'square' });
                playTone({ start_hz: 784, end_hz: 784, duration: 0.05, peak: 0.1, wave: 'square', delay: 0.045 });
            },
            toggle: () =>
            {
                playTone({ start_hz: 440, end_hz: 880, duration: 0.07, peak: 0.1, wave: 'square' });
            },
            tick: () =>
            {
                playTone({ start_hz: 1760, end_hz: 1760, duration: 0.012, peak: 0.04, wave: 'square' });
            },
            sparkle: () =>
            {
                // Coin pickup: a short note then a long higher one
                playTone({ start_hz: 988, end_hz: 988, duration: 0.07, peak: 0.1, wave: 'square' });
                playTone({ start_hz: 1319, end_hz: 1319, duration: 0.35, peak: 0.1, wave: 'square', delay: 0.07 });
            },
        },

        // Wind chimes: soft bells on a pentatonic scale, each tap a random note
        wind_chime: {
            press: () =>
            {
                chimeNote(tools, pick(CHIME_NOTES_HZ.slice(0, 3)), 0.13);
                playNoise({ duration: 0.02, peak: 0.05, filter_hz: 3000, q: 1.5 });
            },
            release: () =>
            {
                playTone({ start_hz: 4186, end_hz: 4180, duration: 0.18, peak: 0.03, wave: 'sine' });
            },
            tab: () =>
            {
                chimeNote(tools, pick(CHIME_NOTES_HZ), 0.12);
            },
            toggle: () =>
            {
                const index = Math.floor(Math.random() * (CHIME_NOTES_HZ.length - 1));
                chimeNote(tools, CHIME_NOTES_HZ[index], 0.1);
                chimeNote(tools, CHIME_NOTES_HZ[index + 1], 0.1, 0.06);
            },
            tick: () =>
            {
                playTone({ start_hz: pick(CHIME_NOTES_HZ) * 2, end_hz: 4000, duration: 0.06, peak: 0.025, wave: 'sine' });
            },
            sparkle: () =>
            {
                // A breeze through the whole set of chimes
                CHIME_NOTES_HZ.forEach((hz, index) =>
                {
                    chimeNote(tools, hz, 0.08, index * 0.07 + Math.random() * 0.03);
                });
            },
        },
    };
}
