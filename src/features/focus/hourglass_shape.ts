import { useTransform, type MotionValue } from 'motion/react';

// Shared hourglass geometry for the 3D and sketch Hourglass skins
// (viewBox 0 0 200 200). The top bulb holds the sand: the longer the
// session, the higher it reaches (60 minutes = a full bulb).

export const GLASS_PATH = 'M62 36 L138 36 C138 70 108 88 104 100 C108 112 138 130 138 164 L62 164 C62 130 92 112 96 100 C92 88 62 70 62 36 Z';
// The inside of the top bulb, where the sand sits (clip shape)
export const TOP_BULB_PATH = 'M65 39 L135 39 C135 70 106 88 102.5 100 L97.5 100 C94 88 65 70 65 39 Z';

export const PLATE_TOP: [number, number, number, number] = [34, 18, 132, 16];         // x, y, width, height
export const PLATE_BOTTOM: [number, number, number, number] = [34, 166, 132, 16];
export const POSTS: [number, number, number, number][] = [[40, 34, 8, 132], [152, 34, 8, 132]];

export const SAND_BOTTOM_Y = 100;
const SAND_FULL_TOP_Y = 40;
const MINUTES_FOR_FULL_BULB = 60;
const DEGREES_PER_MINUTE = 6;

// The top of the sand (y) for a dial angle, as a motion value
export function useSandLevel(sweep_degrees: MotionValue<number>): MotionValue<number>
{
    return useTransform(sweep_degrees, (degrees) =>
    {
        const share = Math.min(Math.max(degrees / DEGREES_PER_MINUTE / MINUTES_FOR_FULL_BULB, 0), 1);
        return SAND_BOTTOM_Y - share * (SAND_BOTTOM_Y - SAND_FULL_TOP_Y);
    });
}
