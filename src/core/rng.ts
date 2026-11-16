import type { RandomFn } from './types';

// Small seedable random generator (mulberry32). Same seed = same sequence,
// which lets tests check gacha and presence-check timing exactly.
export function createSeededRandom(seed: number): RandomFn
{
    let state = seed >>> 0;
    return () =>
    {
        state = (state + 0x6d2b79f5) >>> 0;
        let mixed = state;
        mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
        mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
    };
}
