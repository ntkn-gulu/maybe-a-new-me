import type { ReactNode } from 'react';
import { ellipsePoints, samplePath, sketchOutline, type Point } from './sketch_draw';

// Doodled versions of icons.tsx for the sketch theme: wobbly pen
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

const SPEAKER = sketchOutline(samplePath('M3.6 9.6 L7 9.5 L11.4 5.6 L11.6 18.4 L7.1 14.5 L3.5 14.4 Z', 3), 0.25, 15, 1.5);
const PALETTE = sketchOutline(samplePath(
    'M12 3.5 C6.5 3.6 3.4 7.6 3.5 12.2 C3.6 17 7.4 20.6 12 20.5 C13.4 20.5 13.9 19.6 13.8 18.6 '
    + 'C13.6 17.2 12.7 16.8 12.8 15.6 C12.9 14.7 13.6 14.2 14.6 14.2 L17.2 14.2 C19.2 14.1 20.6 12.6 20.5 10.5 '
    + 'C20.3 6.6 16.6 3.4 12 3.5 Z', 5), 0.3, 17, 2);
const BADGE_RING = sketchOutline(ellipsePoints(12, 9, 5.4, 5.4, 12), 0.3, 19, 2.5);

export function SketchSoundIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={SPEAKER} />
            <path d="M5.2 11 L8.4 10.4 M5.4 12.8 L9.6 11.4" strokeWidth={1.2} />
            <path d="M15.4 9.1 C16.9 10.6 17 13.3 15.6 15" />
            <path d="M18.2 6.4 C21.2 9.4 21.3 14.6 18.4 17.8" />
        </Doodle>
    );
}

export function SketchPaletteIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d={PALETTE} />
            <path d="M7.2 10.6 L8.6 11.6 M10.3 7 L11.6 7.9 M14.7 7.6 L16 8.6" strokeWidth={2.6} />
        </Doodle>
    );
}

export function SketchBadgeIcon(props: IconProps)
{
    return (
        <Doodle size={props.size}>
            <path d="M8.7 13.5 L7.1 20.9 L12.1 18.3 L16.9 21.1 L15.3 13.7" />
            <path d={BADGE_RING} />
            <path d="M10.6 8.2 L13.4 9.9 M10.8 10 L13.2 8.1" strokeWidth={1.5} />
        </Doodle>
    );
}
