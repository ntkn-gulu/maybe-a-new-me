// Hand-drawn geometry for the sketch theme, computed in code.
// Every "wobble" and every hatch line is plain vector geometry made
// once from a fixed seed (same seed = same drawing). The result is ordinary
// SVG path data with no SVG filters, so iPhone Safari draws it as cheaply
// as the 3D theme's flat polygons and it stays sharp at any size.
// Pure functions: no React, no DOM.

export type Point = [number, number];

// Random numbers in [0, 1)
export type Random = () => number;

const PATH_TOKEN = /[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi;
const DEFAULT_CURVE_STEPS = 10;       // points sampled along each curve segment

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
function randomSigned(random: Random): number
{
    return random() * 2 - 1;
}

function formatNumber(value: number): string
{
    return String(Math.round(value * 10) / 10);
}

// Turns absolute SVG path data (M, L, C, Z only) into a list of points.
// The closing point is not repeated.
export function samplePath(d: string, curve_steps: number = DEFAULT_CURVE_STEPS): Point[]
{
    const tokens = d.match(PATH_TOKEN) ?? [];
    const points: Point[] = [];
    let index = 0;
    let command = '';
    let current: Point = [0, 0];

    const readNumber = (): number => Number(tokens[index++]);

    while (index < tokens.length)
    {
        if (/[MLCZ]/i.test(tokens[index]))
        {
            command = tokens[index++].toUpperCase();
            if (command === 'Z')
            {
                continue;
            }
        }
        if (command === 'M' || command === 'L')
        {
            current = [readNumber(), readNumber()];
            points.push(current);
        }
        else if (command === 'C')
        {
            const control_a: Point = [readNumber(), readNumber()];
            const control_b: Point = [readNumber(), readNumber()];
            const end: Point = [readNumber(), readNumber()];
            for (let step = 1; step <= curve_steps; step++)
            {
                points.push(cubicPoint(current, control_a, control_b, end, step / curve_steps));
            }
            current = end;
        }
        else
        {
            index++;      // unknown token: skip it instead of looping forever
        }
    }

    // A closed path ends where it started; drop the duplicate
    const first = points[0];
    const last = points[points.length - 1];
    if (points.length > 1 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.01)
    {
        points.pop();
    }
    return points;
}

function cubicPoint(start: Point, control_a: Point, control_b: Point, end: Point, t: number): Point
{
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const e = t * t * t;
    return [
        a * start[0] + b * control_a[0] + c * control_b[0] + e * end[0],
        a * start[1] + b * control_a[1] + c * control_b[1] + e * end[1],
    ];
}

// Points on a circle (or ellipse when radius_y is given), clockwise from 12 o'clock
export function ellipsePoints(center_x: number, center_y: number, radius_x: number, radius_y: number, count: number): Point[]
{
    return Array.from({ length: count }, (_, index) =>
    {
        const angle = (index / count) * Math.PI * 2;
        return [center_x + radius_x * Math.sin(angle), center_y - radius_y * Math.cos(angle)] as Point;
    });
}

// Scales points around `origin`, then moves them by `offset`
export function scalePoints(points: Point[], scale: number, origin: Point, offset: Point = [0, 0]): Point[]
{
    return points.map(([x, y]) => [
        origin[0] + (x - origin[0]) * scale + offset[0],
        origin[1] + (y - origin[1]) * scale + offset[1],
    ]);
}

// Keeps the part of a polygon on the side of the line where
// normal_x * x + normal_y * y >= limit (Sutherland-Hodgman with one edge)
export function clipToHalfPlane(polygon: Point[], normal: Point, limit: number): Point[]
{
    const isInside = (point: Point): boolean => normal[0] * point[0] + normal[1] * point[1] >= limit;
    const result: Point[] = [];
    for (let index = 0; index < polygon.length; index++)
    {
        const current = polygon[index];
        const next = polygon[(index + 1) % polygon.length];
        const current_inside = isInside(current);
        const next_inside = isInside(next);
        if (current_inside)
        {
            result.push(current);
        }
        if (current_inside !== next_inside)
        {
            const current_value = normal[0] * current[0] + normal[1] * current[1];
            const next_value = normal[0] * next[0] + normal[1] * next[1];
            const t = (limit - current_value) / (next_value - current_value);
            result.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
        }
    }
    return result;
}

interface WobbleOptions
{
    amplitude: number;            // how far the line strays from the true shape
    seed: number;
    is_closed?: boolean;          // default true
    overshoot?: number;           // closed lines: points drawn past the start, like a pen that does not stop exactly
}

// Moves every point a little along the line's normal with smooth, seeded
// noise (two slow waves plus a tiny shake), like a steady but human hand.
export function wobblePoints(points: Point[], options: WobbleOptions): Point[]
{
    const random = createRandom(options.seed);
    const is_closed = options.is_closed ?? true;
    const count = points.length;
    // Whole numbers of waves around a closed line, so the noise meets itself at the start
    const wave_a = 2 + Math.floor(random() * 3);
    const wave_b = 5 + Math.floor(random() * 4);
    const phase_a = random();
    const phase_b = random();

    const noiseAt = (position: number): number =>
        0.65 * Math.sin(2 * Math.PI * (wave_a * position + phase_a))
        + 0.35 * Math.sin(2 * Math.PI * (wave_b * position + phase_b));

    const wobbled = points.map((point, index) =>
    {
        const normal = normalAt(points, index, is_closed);
        const offset = options.amplitude * (noiseAt(index / count) + 0.15 * randomSigned(random));
        return [point[0] + normal[0] * offset, point[1] + normal[1] * offset] as Point;
    });

    const overshoot = is_closed ? Math.min(options.overshoot ?? 0, count - 1) : 0;
    for (let index = 0; index < overshoot; index++)
    {
        // The second pass over the start drifts outward a little
        const normal = normalAt(points, index, true);
        const drift = options.amplitude * (0.6 + (index / Math.max(overshoot, 1)) * 0.8);
        const base = wobbled[index];
        wobbled.push([base[0] + normal[0] * drift, base[1] + normal[1] * drift]);
    }
    return wobbled;
}

function normalAt(points: Point[], index: number, is_closed: boolean): Point
{
    const count = points.length;
    const previous = points[is_closed ? (index - 1 + count) % count : Math.max(index - 1, 0)];
    const next = points[is_closed ? (index + 1) % count : Math.min(index + 1, count - 1)];
    const dx = next[0] - previous[0];
    const dy = next[1] - previous[1];
    const length = Math.hypot(dx, dy) || 1;
    return [dy / length, -dx / length];
}

// Smooth SVG path through the points (Catmull-Rom turned into cubic curves)
export function smoothPath(points: Point[], is_closed: boolean): string
{
    if (points.length < 2)
    {
        return '';
    }
    const count = points.length;
    const pointAt = (index: number): Point => is_closed
        ? points[(index + count) % count]
        : points[Math.min(Math.max(index, 0), count - 1)];

    const parts = [`M${formatNumber(points[0][0])} ${formatNumber(points[0][1])}`];
    const segment_count = is_closed ? count : count - 1;
    for (let index = 0; index < segment_count; index++)
    {
        const p0 = pointAt(index - 1);
        const p1 = pointAt(index);
        const p2 = pointAt(index + 1);
        const p3 = pointAt(index + 2);
        const control_a: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const control_b: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        parts.push(`C${formatNumber(control_a[0])} ${formatNumber(control_a[1])} `
            + `${formatNumber(control_b[0])} ${formatNumber(control_b[1])} `
            + `${formatNumber(p2[0])} ${formatNumber(p2[1])}`);
    }
    if (is_closed)
    {
        parts.push('Z');
    }
    return parts.join(' ');
}

// A wobbly hand-drawn outline of a closed shape, as path data
export function sketchOutline(points: Point[], amplitude: number, seed: number, overshoot: number = 0): string
{
    const wobbled = wobblePoints(points, { amplitude, seed, is_closed: true, overshoot });
    // With an overshoot the pen passes the start, so the line stays open
    return smoothPath(wobbled, overshoot === 0);
}

interface Span
{
    y: number;
    start: number;
    end: number;
}

interface HatchOptions
{
    angle: number;                // line direction in degrees (0 = horizontal)
    gap: number;                  // distance between lines
    seed: number;
    jitter?: number;              // how uneven the lines are (0..1, default 0.3)
    inset?: number;               // lines may stop up to this far short of the edge (default 1.2)
}

// Pen hatching: straight parallel lines filling a polygon, each one a
// little uneven like a steady hand. All lines in one path (cheap to draw).
export function hatchLines(polygon: Point[], options: HatchOptions): string
{
    const random = createRandom(options.seed);
    const jitter = options.jitter ?? 0.3;
    const inset = options.inset ?? 1.2;
    const radians = (options.angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Turn the shape so hatch lines become horizontal rows
    const rotated: Point[] = polygon.map(([x, y]) => [x * cos + y * sin, -x * sin + y * cos]);
    const toPage = ([x, y]: Point): Point => [x * cos - y * sin, x * sin + y * cos];
    const ys = rotated.map((point) => point[1]);
    const max_y = Math.max(...ys);

    const parts: string[] = [];
    let y = Math.min(...ys) + options.gap * (0.2 + 0.6 * random());
    while (y < max_y)
    {
        for (const span of rowSpans(rotated, y))
        {
            const start = span.start + random() * inset;
            const end = span.end - random() * inset;
            if (end - start < 1)
            {
                continue;
            }
            const tilt = options.gap * 0.2 * jitter * randomSigned(random);
            const [x1, y1] = toPage([start, y - tilt]);
            const [x2, y2] = toPage([end, y + tilt]);
            parts.push(`M${formatNumber(x1)} ${formatNumber(y1)}L${formatNumber(x2)} ${formatNumber(y2)}`);
        }
        y += options.gap * (1 + jitter * 0.3 * randomSigned(random));
    }
    return parts.join('');
}

// Where the horizontal row at height `y` is inside the polygon (even-odd rule)
function rowSpans(polygon: Point[], y: number): Span[]
{
    const crossings: number[] = [];
    for (let index = 0; index < polygon.length; index++)
    {
        const [x1, y1] = polygon[index];
        const [x2, y2] = polygon[(index + 1) % polygon.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y))
        {
            crossings.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
        }
    }
    crossings.sort((a, b) => a - b);
    const spans: Span[] = [];
    for (let index = 0; index + 1 < crossings.length; index += 2)
    {
        spans.push({ y, start: crossings[index], end: crossings[index + 1] });
    }
    return spans;
}
