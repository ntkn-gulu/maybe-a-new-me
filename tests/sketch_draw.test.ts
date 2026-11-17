import { describe, expect, it } from 'vitest';
import {
    clipToHalfPlane,
    createRandom,
    densifyPolygon,
    ellipsePoints,
    hatchLines,
    samplePath,
    scalePoints,
    sketchOutline,
    smoothPath,
    wobblePoints,
    type Point,
} from '../src/ui/sketch_draw';

const SQUARE: Point[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

function pathNumbers(d: string): number[]
{
    return (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
}

describe('createRandom', () =>
{
    it('gives the same numbers for the same seed', () =>
    {
        const a = createRandom(7);
        const b = createRandom(7);
        expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    });

    it('stays in [0, 1)', () =>
    {
        const random = createRandom(3);
        for (let index = 0; index < 500; index++)
        {
            const value = random();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });
});

describe('samplePath', () =>
{
    it('samples lines and curves and drops the closing duplicate', () =>
    {
        const points = samplePath('M0 0 L10 0 C10 5 10 5 10 10 L0 0 Z', 4);
        expect(points[0]).toEqual([0, 0]);
        expect(points[1]).toEqual([10, 0]);
        expect(points[5]).toEqual([10, 10]);
        expect(points).toHaveLength(6);
    });
});

describe('scalePoints / ellipsePoints', () =>
{
    it('scales around an origin', () =>
    {
        expect(scalePoints([[10, 10]], 0.5, [0, 0], [1, 2])).toEqual([[6, 7]]);
    });

    it('starts a circle at 12 o\'clock', () =>
    {
        const [first] = ellipsePoints(50, 50, 10, 10, 8);
        expect(first[0]).toBeCloseTo(50);
        expect(first[1]).toBeCloseTo(40);
    });
});

describe('clipToHalfPlane', () =>
{
    it('keeps the right half of a square', () =>
    {
        const half = clipToHalfPlane(SQUARE, [1, 0], 50);
        const xs = half.map((point) => point[0]);
        expect(Math.min(...xs)).toBeCloseTo(50);
        expect(Math.max(...xs)).toBe(100);
        expect(half).toHaveLength(4);
    });
});

describe('wobblePoints', () =>
{
    it('is repeatable and stays close to the shape', () =>
    {
        const circle = ellipsePoints(0, 0, 50, 50, 40);
        const first = wobblePoints(circle, { amplitude: 2, seed: 5 });
        const second = wobblePoints(circle, { amplitude: 2, seed: 5 });
        expect(first).toEqual(second);
        for (const [x, y] of first)
        {
            expect(Math.abs(Math.hypot(x, y) - 50)).toBeLessThanOrEqual(2.5);
        }
    });

    it('adds overshoot points past the start', () =>
    {
        const circle = ellipsePoints(0, 0, 50, 50, 20);
        expect(wobblePoints(circle, { amplitude: 1, seed: 1, overshoot: 3 })).toHaveLength(23);
    });
});

describe('smoothPath / sketchOutline', () =>
{
    it('builds closed and open paths', () =>
    {
        expect(smoothPath(SQUARE, true)).toMatch(/^M0 0 C.* Z$/);
        expect(smoothPath(SQUARE, false).endsWith('Z')).toBe(false);
        expect(sketchOutline(SQUARE, 1, 2, 2).endsWith('Z')).toBe(false);
    });
});

describe('hatchLines', () =>
{
    it('fills the shape with straight lines that stay inside it', () =>
    {
        const d = hatchLines(SQUARE, { angle: 52, gap: 5, seed: 3 });
        expect(d.split('M').filter(Boolean).length).toBeGreaterThan(20);
        for (const value of pathNumbers(d))
        {
            expect(value).toBeGreaterThanOrEqual(-0.5);
            expect(value).toBeLessThanOrEqual(100.5);
        }
    });

    it('is repeatable for the same seed', () =>
    {
        expect(hatchLines(SQUARE, { angle: 30, gap: 6, seed: 8 })).toBe(hatchLines(SQUARE, { angle: 30, gap: 6, seed: 8 }));
    });
});

describe('densifyPolygon', () =>
{
    it('keeps the corners and adds points along each edge', () =>
    {
        const dense = densifyPolygon(SQUARE, 10);
        expect(dense).toHaveLength(40);
        expect(dense[0]).toEqual([0, 0]);
        expect(dense[10]).toEqual([100, 0]);
        expect(dense[20]).toEqual([100, 100]);
    });
});
