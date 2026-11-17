import type { ReactNode } from 'react';
import { ellipsePoints, samplePath, sketchOutline, type Point } from './sketch_draw';

// Doodled versions of the tab bar icons for the sketch theme: wobbly pen
// lines in currentColor (the parent picks the color), computed once with
// sketch_draw.ts. Same 24 x 24 box and default size as icons.tsx.

const DEFAULT_ICON_SIZE = 26;
const STROKE_WIDTH = 2;

const FLAME_OUTLINE = sketchOutline(samplePath(
    'M12 2.5 C13.2 6 17.5 8.5 17.5 14 C17.5 18 15 21 12 21 C9 21 6.5 18 6.5 14.5 '
    + 'C6.5 12 7.6 10.4 8.8 9.2 C9 11 9.8 12 10.6 12.3 C10 9 11.2 5.6 12 2.5 Z', 6), 0.35, 3, 2);
const FLAME_CORE = sketchOutline(samplePath(
    'M12 13.8 C13.2 15.2 14 16.3 14 17.6 C14 18.9 13.1 19.4 12 19.4 C10.9 19.4 10 18.9 10 17.6 C10 16.3 10.8 15.2 12 13.8 Z', 5), 0.25, 5, 1);

const TIMER_RING = sketchOutline(ellipsePoints(12, 13.5, 7.3, 7.3, 16), 0.35, 7, 3);

const CHEST_BODY = sketchOutline(samplePath('M3.5 10.5 L20.5 10.5 L20.5 19.8 L3.5 19.8 Z', 4), 0.3, 9, 2);
const CHEST_LID = 'M3.6 10.4 C3.4 6.6 5.6 4.6 8.6 4.3 L15.6 4.2 C18.6 4.5 20.6 6.6 20.4 10.6';

const GEAR_RING = sketchOutline(ellipsePoints(12, 12, 6, 6, 14), 0.35, 11, 3);
const GEAR_HUB = sketchOutline(ellipsePoints(12, 12, 2.3, 2.3, 8), 0.2, 13, 1);
// Eight short teeth sticking out of the ring, a little uneven
const GEAR_TEETH = Array.from({ length: 8 }, (_, index) =>
{
    const angle = (index / 8) * Math.PI * 2 + (index % 2 === 0 ? 0.04 : -0.05);
    const inner: Point = [12 + 6.4 * Math.sin(angle), 12 - 6.4 * Math.cos(angle)];
    const outer: Point = [12 + (9.2 + (index % 3) * 0.3) * Math.sin(angle), 12 - (9.2 + (index % 3) * 0.3) * Math.cos(angle)];
    return `M${inner[0].toFixed(1)} ${inner[1].toFixed(1)}L${outer[0].toFixed(1)} ${outer[1].toFixed(1)}`;
}).join('');

interface IconProps
{
    size?: number;
}

function Doodle(props: { size?: number; children: ReactNode })
{
    const size = props.size ?? DEFAULT_ICON_SIZE;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {props.children}
        </svg>
    );
}

export function SketchFlameIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={FLAME_OUTLINE} />
            <path d={FLAME_CORE} strokeWidth={1.5} />
        </Doodle>
    );
}

export function SketchTimerIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={TIMER_RING} />
            <path d="M12 13.6 L12.3 9.6 M9.4 2.7 L14.6 2.5 M18.4 6.6 L19.9 5.2" />
        </Doodle>
    );
}

export function SketchChestIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={CHEST_BODY} />
            <path d={CHEST_LID} />
            <path d="M10.2 9.2 L13.8 9.1 L13.9 13.4 L10.1 13.5 Z" fill="currentColor" strokeWidth={1.4} />
        </Doodle>
    );
}

export function SketchGearIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={GEAR_RING} />
            <path d={GEAR_TEETH} strokeWidth={2.4} />
            <path d={GEAR_HUB} strokeWidth={1.6} />
        </Doodle>
    );
}
