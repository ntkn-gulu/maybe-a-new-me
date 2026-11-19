import { createRandom, formatNumber, randomSigned, type Point } from './sketch_random';

// Fills for the sketch theme: pen hatching inside a shape and quick marker
// coloring of a box. Plain vector strokes made once from a seed (no SVG
// filters), like the rest of sketch_draw. Pure functions: no React, no DOM.

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

export interface MarkerStroke
{
    d: string;
    width: number;
}

interface MarkerOptions
{
    gap?: number;                 // distance between strokes (default 6.5)
    slant?: number;               // sideways travel per unit of height (default 0.45)
    bleed?: number;               // how far strokes may run past the box (default 2.5)
}

// Marker coloring of a width x height box (px), the way a hand colors in a
// shape quickly: slanted strokes side by side, each its own line so the
// semi-transparent marker darkens where they overlap. Stroke widths, tilt,
// bends and both ends vary; ends stop a little short or run past the edge,
// and the odd gap lets the paper show through.
export function markerStrokes(width: number, height: number, seed: number, options: MarkerOptions = {}): MarkerStroke[]
{
    const random = createRandom(seed);
    const gap = options.gap ?? 6.5;
    const slant = options.slant ?? 0.45;
    const bleed = options.bleed ?? 2.5;
    const lean = height * slant;
    const strokes: MarkerStroke[] = [];

    let x = -lean + random() * gap;
    while (x < width)
    {
        const stroke_width = 6 + random() * 4;
        const cap = stroke_width / 2;             // a round cap reaches this far past the end point

        // Where the visible end lands: mostly a little past the edge, sometimes short of it
        const edgeY = (edge: number, direction: number): number =>
            edge + direction * ((random() < 0.65 ? random() * bleed : -random() * bleed) - cap);

        const bottom: Point = [x + (random() - 0.5) * 2, edgeY(height, 1)];
        const top: Point = [x + lean + (random() - 0.5) * 3, edgeY(0, -1)];

        // Keep the stroke within the box sideways (plus a small, uneven spill)
        const left_limit = cap * 0.6 - random() * 2;
        const right_limit = width - cap * 0.6 + random() * 2;
        const dx = top[0] - bottom[0];
        const t_start = dx === 0 ? 0 : Math.max(0, (left_limit - bottom[0]) / dx);
        const t_end = dx === 0 ? 1 : Math.min(1, (right_limit - bottom[0]) / dx);
        if (t_end > t_start + 0.05)
        {
            const pointAt = (t: number): Point => [bottom[0] + dx * t, bottom[1] + (top[1] - bottom[1]) * t];
            const start = pointAt(t_start);
            const end = pointAt(t_end);
            const bend = (random() - 0.5) * 3;
            const control: Point = [(start[0] + end[0]) / 2 + bend, (start[1] + end[1]) / 2];
            strokes.push({
                d: `M${formatNumber(start[0])} ${formatNumber(start[1])}Q${formatNumber(control[0])} ${formatNumber(control[1])} ${formatNumber(end[0])} ${formatNumber(end[1])}`,
                width: stroke_width,
            });
        }
        x += gap * (0.7 + random() * 0.65);
    }
    return strokes;
}
