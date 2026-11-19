// Shared base of the sketch drawing helpers: the point type, the ink color
// and the seeded randomness that makes every drawing repeatable.
// Pure functions: no React, no DOM.

export type Point = [number, number];

// The sketch theme's black ink
export const SKETCH_INK = '#1f1c18';

// Random numbers in [0, 1)
export type Random = () => number;


// Small seeded generator (mulberry32): the same seed always gives the same drawing
export function createRandom(seed: number): Random
{
    let state = seed >>> 0;
    return () =>
    {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

// Random value in [-1, 1)
export function randomSigned(random: Random): number
{
    return random() * 2 - 1;
}

// Path numbers rounded to one decimal: shorter path data, no visible difference
export function formatNumber(value: number): string
{
    return String(Math.round(value * 10) / 10);
}
