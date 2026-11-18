import { useState } from 'react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';

// Shared bits for the timer skin dials.

export const DEGREES_PER_MINUTE = 6;          // 60 minutes = full circle

// Whole minutes shown by a dial, following the Focus screen's spring value.
// Digits step through every minute while the spring turns.
export function useDialMinutes(sweep_degrees: MotionValue<number>): number
{
    const [minutes, setMinutes] = useState(() => Math.round(sweep_degrees.get() / DEGREES_PER_MINUTE));
    useMotionValueEvent(sweep_degrees, 'change', (degrees) =>
    {
        const next = Math.round(degrees / DEGREES_PER_MINUTE);
        setMinutes((current) => (current === next ? current : next));
    });
    return minutes;
}

// Open arc (no center point) from 12 o'clock clockwise to `degrees`
export function arcPath(center: number, radius: number, degrees: number): string
{
    const clamped = Math.min(Math.max(degrees, 0.01), 359.9);
    const radians = (clamped * Math.PI) / 180;
    const end_x = center + radius * Math.sin(radians);
    const end_y = center - radius * Math.cos(radians);
    const large_arc = clamped > 180 ? 1 : 0;
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 ${large_arc} 1 ${end_x.toFixed(2)} ${end_y.toFixed(2)}`;
}
